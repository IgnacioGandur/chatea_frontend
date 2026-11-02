import type { Prisma } from "../../generated/prisma/client";
import type {
    includeParticipantsWithUser,
    includeParticipantsOmitPassword,
} from "./groups.includes";

export type GroupWithParticipants = Prisma.ConversationGetPayload<{
    include: typeof includeParticipantsWithUser;
}>;

export type GroupConversation = Omit<
    GroupWithParticipants,
    "title" | "profilePicture" | "description"
> & {
    title: string;
    profilePicture: string;
    description: string;
};

export type GroupsPage = {
    groups: GroupConversation[];
    nextCursor: number | null;
};

export type GroupByIdIncludeParticipantsOmitPassword =
    Prisma.ConversationGetPayload<{
        include: typeof includeParticipantsOmitPassword;
    }>;
