import * as z from "zod";
import checkIfUserExistsById from "./custom-validators/checkIfUserExistsById";
import friendshipModel from "~/db/friendship.model";

export function validateSendFriendshipRequest(
    userAId: number,
    userBId: number,
) {
    return z
        .object({
            userAId: z.number("The userAId field should be a number."),
            userBId: z
                .number("The userBId field should be a number.")
                .refine(checkIfUserExistsById, {
                    error: `The user with and ID of '${userBId}' doesn't exist.`,
                    path: ["userBId"],
                })
                .refine(
                    async (userBId) => {
                        const friendshipAlreadyExists =
                            await friendshipModel.getFriendshipBetweenUserIds(
                                userAId,
                                userBId,
                            );

                        if (friendshipAlreadyExists) {
                            return false;
                        }

                        return true;
                    },
                    { error: "This friendship already exists." },
                ),
        })
        .safeParseAsync({
            userAId,
            userBId,
        });
}
