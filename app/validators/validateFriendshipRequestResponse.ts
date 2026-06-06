import * as z from "zod";
import friendshipModel from "~/db/friendship.model";

export function validateFriendshipRequestResponse(
    loggedUserId: number,
    friendshipId: number,
    response: "accept" | "reject",
) {
    return z
        .object({
            response: z.enum(["accept", "reject"], {
                error: (issue) =>
                    `Invalid response value. Response can only be 'accept' or 'reject'. Received: '${issue.input}'.`,
            }),
            friendshipId: z.number("Friendship ID should be a number."),
        })
        .superRefine(async (data, ctx) => {
            const { friendshipId } = data;

            const friendship =
                await friendshipModel.getFriendshipById(friendshipId);

            if (!friendship) {
                ctx.addIssue({
                    code: "custom",
                    path: ["friendshipId"],
                    message: `The friendship with an ID of: '${friendshipId}' doesn't exist.`,
                });

                return;
            }

            const loggedUserIsParticipant =
                friendship.userAId === loggedUserId ||
                friendship.userBId === loggedUserId;

            if (!loggedUserIsParticipant) {
                ctx.addIssue({
                    code: "custom",
                    path: ["friendshipId"],
                    message: "You are not a part of this conversation.",
                });
            }
        })
        .safeParseAsync({
            friendshipId,
            response,
        });
}
