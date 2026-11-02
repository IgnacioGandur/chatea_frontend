import type { Prisma } from "../../generated/prisma/client";

export const includeParticipantsWithUser = {
    _count: {
        select: {
            participants: true,
        },
    },
    participants: {
        take: 10,
        include: {
            user: {
                omit: {
                    password: true,
                },
            },
        },
    },
} satisfies Prisma.ConversationInclude;

export const includeParticipants = {
    participants: true,
} satisfies Prisma.ConversationInclude;

export const includeParticipantsOmitPassword = {
    participants: {
        include: {
            user: {
                omit: {
                    password: true,
                },
            },
        },
    },
} satisfies Prisma.ConversationInclude;
