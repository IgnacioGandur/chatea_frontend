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
