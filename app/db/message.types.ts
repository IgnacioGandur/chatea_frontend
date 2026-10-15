import type { Prisma } from "../../generated/prisma/client";
import type {
    createMessageInclude,
    createMessageWithAttachmentAndSenderInclude,
    loadMoreMessagesInclude,
} from "./message.includes";

export type CreateMessage = Prisma.MessageGetPayload<{
    include: typeof createMessageInclude;
}>;

export type LoadMoreMessages = {
    messages: Prisma.MessageGetPayload<{
        include: typeof loadMoreMessagesInclude;
    }>[];
    hasMoreMessages: boolean;
    nextCursor: number | null;
};

export type CreateMessageWithAttachmentAndSender = Prisma.MessageGetPayload<{
    include: typeof createMessageWithAttachmentAndSenderInclude;
}>;
