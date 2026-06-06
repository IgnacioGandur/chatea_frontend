import type { Prisma } from "../../generated/prisma/client";
import type {
    includeParticipants,
    includeParticipantsWithUser,
} from "./groups.includes";

export type GroupConversationWithParticipantsAndUser = Omit<
    Prisma.ConversationGetPayload<{
        include: typeof includeParticipantsWithUser;
    }>,
    "title" | "profilePicture" | "description"
> & {
    title: string;
    profilePicture: string;
    description: string;
};

export type GroupWithParticipants = Prisma.ConversationGetPayload<{
    include: typeof includeParticipants;
}>;
