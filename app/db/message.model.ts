import type {
    PrismaClient,
    Message as MessageType,
    Prisma,
} from "../../generated/prisma/client";
import { createMessageInclude } from "./message.includes";
import type { CreateMessage } from "./message.types";
import prisma from "./prisma";

type MessageWithAttachment = Prisma.MessageGetPayload<{
    include: {
        attachments: true;
    };
}>;

class Message {
    prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async create(
        conversationId: number | string,
        content: string,
        senderId: string | number,
    ): Promise<CreateMessage> {
        const [message] = await this.prisma.$transaction([
            this.prisma.message.create({
                data: {
                    content,
                    senderId: Number(senderId),
                    conversationId: Number(conversationId),
                },
                include: createMessageInclude,
            }),
            this.prisma.conversation.update({
                where: {
                    id: Number(conversationId),
                },
                data: {
                    lastMessageAt: new Date(),
                },
            }),
            this.prisma.participant.updateMany({
                where: {
                    conversationId: Number(conversationId),
                },
                data: {
                    listVisible: true,
                },
            }),
        ]);

        return message;
    }

    async createWithAttachment(
        conversationId: number,
        content: string,
        senderId: number,
        fileName: string,
        fileUrl: string,
        fileType: string,
    ): Promise<MessageType> {
        return await this.prisma.message.create({
            data: {
                conversationId,
                content,
                senderId,
                attachments: {
                    create: {
                        fileName,
                        fileType,
                        fileUrl,
                    },
                },
            },
            include: {
                attachments: true,
                sender: true,
            },
        });
    }

    async deleteById(id: number): Promise<void> {
        await this.prisma.message.update({
            where: {
                id,
            },
            data: {
                deleted: true,
            },
        });
    }

    async getMessageById(id: number): Promise<MessageType | null> {
        return await this.prisma.message.findUnique({
            where: {
                id,
            },
        });
    }

    async loadMoreMessages(
        conversationId: number,
        userId: number,
        cursorId: number,
        take: number = 2,
    ): Promise<{
        messages: any[];
        hasMoreMessages: boolean;
        nextCursor: number | null;
    } | null> {
        return await this.prisma.$transaction(async (tx) => {
            // Check the boundary till which this user can pull messages.
            const participant = await tx.participant.findUnique({
                where: {
                    userId_conversationId: {
                        userId,
                        conversationId,
                    },
                },
                select: {
                    lastDeletedAt: true,
                },
            });

            if (!participant) {
                return null;
            }

            // If the user was previously in the conversation but left, use the 'lastDeletedAt' field as a limit to fetch the visible messages.
            const boundaryDate = participant.lastDeletedAt;

            const messages = await tx.message.findMany({
                cursor: { id: cursorId },
                // skip: 1,
                where: {
                    conversationId: conversationId,
                    // If boundary date exists, pull messages only till certain date.
                    ...(boundaryDate
                        ? {
                              createdAt: {
                                  gt: boundaryDate,
                              },
                          }
                        : {}),
                },
                include: {
                    attachments: true,
                    sender: {
                        omit: {
                            password: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                take: take + 1,
            });

            const cleanedMessages = messages.map((m) =>
                m.deleted ? { ...m, content: "Message deleted." } : m,
            );

            const hasMoreMessages = cleanedMessages.length > take;
            let nextCursor: number | null = null;

            if (hasMoreMessages) {
                const nextMessage = cleanedMessages.pop();
                nextCursor = nextMessage ? Number(nextMessage.id) : null;
            }

            const reversedMessages = [...cleanedMessages].reverse();

            return {
                messages: reversedMessages,
                hasMoreMessages,
                nextCursor,
            };
        });
    }
}

export default new Message(prisma);
