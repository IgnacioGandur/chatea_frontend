import type { User } from "../../generated/prisma/client";

export type UserProfileStats = Promise<{
    user: User;
    sentMessagesCount: number;
    friendshipsCount: number;
    totalConversationsCount: number;
    privateConversationsCount: number;
    groupConversationsCount: number;
    ownedGroupsCount: number;
}>;
