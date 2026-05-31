import prisma from "./prisma";
import type {
    PrismaClient,
    Prisma,
    Conversation as ConversationType,
} from "../../generated/prisma/client";
import type {
    GetConversationByIdMessagesInclude,
    GetUserConversations,
} from "./conversation.types";

class Conversation {
    prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async create(
        userAId: string | number,
        userBId: string | number,
        message: string,
        isGroup: boolean,
    ): Promise<ConversationType> {
        const conversation = await this.prisma.conversation.create({
            data: {
                isGroup,
                lastMessageAt: new Date(),
                ownerId: Number(userAId),
                participants: {
                    create: [
                        { userId: Number(userAId) },
                        { userId: Number(userBId) },
                    ],
                },
                messages: {
                    create: {
                        senderId: Number(userAId),
                        content: message,
                    },
                },
            },
        });

        return conversation;
    }

    async get(id: number | string): Promise<ConversationType | null> {
        return await this.prisma.conversation.findUnique({
            where: {
                id: Number(id),
            },
        });
    }

    async getUserConversations(
        userId: number | string,
        search: string | null,
        take?: string | number,
    ): Promise<{
        conversations: GetUserConversations[];
        count: number;
    }> {
        const where: Prisma.ConversationWhereInput = {
            // Get all conversation in which the user is a part of.
            participants: {
                some: {
                    userId: Number(userId),
                    listVisible: true,
                },
            },
            // If the query contains a search query, filter by it.
            ...(search && {
                OR: [
                    {
                        title: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    {
                        participants: {
                            some: {
                                user: {
                                    username: {
                                        contains: search,
                                        mode: "insensitive",
                                    },
                                },
                                NOT: {
                                    userId: Number(userId),
                                },
                            },
                        },
                    },
                ],
            }),
        };

        const [conversations, count] = await this.prisma.$transaction([
            this.prisma.conversation.findMany({
                where,
                include: {
                    participants: {
                        include: {
                            user: {
                                omit: {
                                    password: true,
                                },
                            },
                        },
                    },
                    messages: {
                        take: 1,
                        orderBy: {
                            createdAt: "desc",
                        },
                    },
                },

                // If pagination is present in the query.
                ...(take && {
                    take: Number(take),
                }),
                orderBy: {
                    lastMessageAt: "desc",
                },
            }),

            // Get the amount of conversations from the query.
            this.prisma.conversation.count({
                where,
                ...(take && {
                    take: Number(take),
                }),
            }),
        ]);

        return {
            conversations,
            count,
        };
    }

    async getConversationBetweenParticipants(
        userAId: string | number,
        userBId: string | number,
    ): Promise<ConversationType | null> {
        return await this.prisma.conversation.findFirst({
            where: {
                isGroup: false,
                AND: [
                    {
                        participants: {
                            some: {
                                userId: Number(userAId),
                            },
                        },
                    },
                    {
                        participants: {
                            some: {
                                userId: Number(userBId),
                            },
                        },
                    },
                ],
            },
        });
    }

    async getConversationById(
        userId: number | string,
        conversationId: number | string,
    ): Promise<GetConversationByIdMessagesInclude | null> {
        return await this.prisma.$transaction(async (tx) => {
            const uId = Number(userId);
            const cId = Number(conversationId);
            const participant = await tx.participant.findUnique({
                where: {
                    userId_conversationId: {
                        userId: uId,
                        conversationId: cId,
                    },
                },
                select: {
                    lastDeletedAt: true,
                },
            });

            if (!participant) return null;

            const boundaryDate = participant.lastDeletedAt || new Date(0);

            return await tx.conversation.findUnique({
                where: {
                    id: cId,
                },
                include: {
                    participants: {
                        include: {
                            user: {
                                omit: {
                                    password: true,
                                },
                            },
                        },
                    },
                    messages: {
                        where: {
                            createdAt: {
                                gt: boundaryDate,
                            },
                        },
                        include: {
                            attachments: true,
                            sender: true,
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                        take: 15 + 1,
                    },
                },
            });
        });
    }
}

export default new Conversation(prisma);
