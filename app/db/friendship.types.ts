import type { Prisma } from "~/../generated/prisma/client";
import type { createFriendshipInclude } from "./friendship.include";

export type FriendshipIncludeUserA = Prisma.FriendshipGetPayload<{
    include: typeof createFriendshipInclude;
}>;
