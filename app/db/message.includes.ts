import type { Prisma } from "../../generated/prisma/client";

export const createMessageInclude = {
    sender: {
        omit: {
            password: true,
        },
    },
    conversation: {
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
    },
} satisfies Prisma.MessageInclude;

export const loadMoreMessagesInclude = {
    attachments: true,
    sender: {
        omit: {
            password: true,
        },
    },
} satisfies Prisma.MessageInclude;

export const createMessageWithAttachmentAndSenderInclude = {
    attachments: true,
    sender: {
        omit: {
            password: true,
        },
    },
} satisfies Prisma.MessageInclude;
