import type { Prisma } from "../../generated/prisma/client";
import type {
    createConversationInclude,
    getConversationByIdMessagesInclude,
    getUserConversationInclude,
} from "./conversation.includes";

export type CreateConversation = Prisma.ConversationGetPayload<{
    include: typeof createConversationInclude;
}>;

export type GetUserConversations = Prisma.ConversationGetPayload<{
    include: typeof getUserConversationInclude;
}>;

export type GetConversationByIdMessagesInclude = Prisma.ConversationGetPayload<{
    include: typeof getConversationByIdMessagesInclude;
}>;
