import type {
    PrismaClient,
    Message as MessageType,
} from "../../generated/prisma/client";
import { createMessageInclude } from "./message.includes";
import type { CreateMessage } from "./message.types";
import prisma from "./prisma";

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
    ): Promise<void> {
        await this.prisma.message.create({
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
}

export default new Message(prisma);
