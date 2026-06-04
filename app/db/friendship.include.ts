import type { Prisma } from "~/../generated/prisma/client";

export const createFriendshipInclude = {
    userA: true,
} satisfies Prisma.FriendshipInclude;

export const getUserAcceptedFriendshipsInclude = {
    userA: true,
    userB: true,
} satisfies Prisma.FriendshipInclude;

export const includeUserA = {
    userA: true,
} satisfies Prisma.FriendshipInclude;
