import * as z from "zod";
import groupsModel from "~/db/groups.model";

export default async function validateLeavingOrJoiningGroup(
    conversationId: number,
    userId: number,
    userShouldBeParticipant: boolean,
) {
    return await z
        .object({
            conversationId: z.number("The conversation ID should be a number."),
            userId: z.number("User id should be a number."),
        })
        .superRefine(async (data, ctx) => {
            const conversation = await groupsModel.getGroupByIdWithParticipants(
                data.conversationId,
            );

            if (!conversation) {
                ctx.addIssue({
                    code: "custom",
                    path: ["conversationId"],
                    message: `The conversation with an ID of: '${data.conversationId}' doesn't exist.`,
                });
                return;
            }

            const isParticipant = conversation.participants.find((p) => {
                return p.userId === data.userId;
            });

            // If user should be a part of the conversation and it's not, then error while leaving.
            if (userShouldBeParticipant && !isParticipant) {
                ctx.addIssue({
                    code: "custom",
                    path: ["conversationId"],
                    message: "You are not a part of this group.",
                });
                return;
            }

            // If user should not be a participant but it's one already, then error while joining group.
            if (!userShouldBeParticipant && isParticipant) {
                ctx.addIssue({
                    code: "custom",
                    path: ["conversationId"],
                    message: "You are already a participant in this group.",
                });
            }
        })
        .safeParseAsync({ conversationId, userId });
}
