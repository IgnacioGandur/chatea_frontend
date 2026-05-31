import type { Prisma } from "../../generated/prisma/client";

export const createConversationInclude = {
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
        include: {
            sender: {
                omit: {
                    password: true,
                },
            },
        },
    },
} satisfies Prisma.ConversationInclude;

export const getUserConversationInclude = {
    participants: {
        include: {
            user: {
                omit: {
                    password: true,
                },
            },
        },
    },
    messages: true,
} satisfies Prisma.ConversationInclude;

export const getConversationByIdMessagesInclude = {
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
                gt: new Date(0),
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
} satisfies Prisma.ConversationInclude;
