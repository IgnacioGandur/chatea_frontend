import type { Prisma } from "../../generated/prisma/client";
import type {
    createConversationInclude,
    getConversationByIdInclude,
    getUserConversationInclude,
} from "./conversation.includes";

export type CreateConversation = Prisma.ConversationGetPayload<{
    include: typeof createConversationInclude;
}>;

export type GetUserConversations = Prisma.ConversationGetPayload<{
    include: typeof getUserConversationInclude;
}>;

export type GetConversationById = {
    conversation: Prisma.ConversationGetPayload<{
        include: typeof getConversationByIdInclude;
    }>;
    nextCursor: number | null;
    hasMoreMessages: boolean;
};
