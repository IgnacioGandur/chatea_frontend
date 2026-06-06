import * as z from "zod";
import friendshipModel from "~/db/friendship.model";

export function validateCancelFriendshipRequest(
    userAId: number,
    friendshipId: number,
) {
    return z
        .object({
            userAId: z.number({
                error: () => "The userAId should be a number.",
            }),
            friendshipId: z.number({
                error: (issue) =>
                    `Friendship ID should be a number. Received: '${issue.input}'`,
            }),
        })
        .superRefine(async (data, ctx) => {
            // 'userAId' is the logged user ID.
            const { userAId, friendshipId } = data;

            const friendship =
                await friendshipModel.getFriendshipById(friendshipId);

            if (!friendship) {
                ctx.addIssue({
                    code: "custom",
                    path: ["friendshipId"],
                    message: `The friendship with an ID of '${friendshipId}' doesn't exist.`,
                });
                return;
            }

            const loggedUserIsParticipant =
                friendship.userAId === userAId ||
                friendship.userBId === userAId;

            if (!loggedUserIsParticipant) {
                ctx.addIssue({
                    code: "custom",
                    path: ["friendshipId"],
                    message: "You are not a part of this friendship.",
                });
            }
        })
        .safeParseAsync({
            userAId,
            friendshipId,
        });
}
