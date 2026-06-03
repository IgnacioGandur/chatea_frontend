import friendshipModel from "~/db/friendship.model";

export default async function checkIfFriendshipExistsById(
    friendshipId: number,
): Promise<boolean> {
    const friendship = await friendshipModel.getFriendshipById(friendshipId);

    if (!friendship) {
        return false;
    }

    return true;
}
