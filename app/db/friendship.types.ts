import type { Prisma } from "~/../generated/prisma/client";
import type {
    createFriendshipInclude,
    getUserAcceptedFriendshipsInclude,
    includeUserA,
} from "./friendship.include";

export type FriendshipIncludeUserA = Prisma.FriendshipGetPayload<{
    include: typeof createFriendshipInclude;
}>;

export type FriendshipIncludeBothUsers = Prisma.FriendshipGetPayload<{
    include: typeof getUserAcceptedFriendshipsInclude;
}>;

export type FriendshipWithUserA = Prisma.FriendshipGetPayload<{
    include: typeof includeUserA;
}>;
