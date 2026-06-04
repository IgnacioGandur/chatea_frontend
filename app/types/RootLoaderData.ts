import type { FriendshipWithUserA } from "~/db/friendship.types";
import type { User } from "../../generated/prisma/client";

export type RootLoaderData = {
    user: User | undefined;
    friendshipRequestsPromise?: Promise<FriendshipWithUserA[]>;
};
