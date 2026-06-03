import type { Prisma } from "~/../generated/prisma/client";

export const createFriendshipInclude = {
    userA: true,
} satisfies Prisma.FriendshipInclude;
