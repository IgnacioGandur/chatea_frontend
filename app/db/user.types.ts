import type { Prisma, Friendship } from "../../generated/prisma/client";

export type UserOmitPassword = Prisma.UserGetPayload<{
    omit: {
        password: true;
    };
}>;

export type UserProfileStats = Promise<{
    user: UserOmitPassword | null;
    sentMessagesCount: number;
    friendshipsCount: number;
    totalConversationsCount: number;
    privateConversationsCount: number;
    groupConversationsCount: number;
    ownedGroupsCount: number;
}>;

export type GetUserPublicProfileByUsername = Promise<{
    user: UserOmitPassword;
    friendshipsCount: number;
    participantGroupsCount: number;
    ownedGroupsCount: number;
    sentMessagesCount: number;
    friendshipStatusWithLoggedUser: Friendship | null;
} | null>;
