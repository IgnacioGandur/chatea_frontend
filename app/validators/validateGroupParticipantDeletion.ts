import * as z from "zod";
import groupsModel from "~/db/groups.model";

export async function validateGroupParticipantDeletion(
    participantId: number,
    conversationId: number,
    loggedUserId: number,
) {
    return z
        .object({
            participantId: z.number(),
            conversationId: z.number(),
            loggedUserId: z.number(),
        })
        .superRefine(async (data, ctx) => {
            const { participantId, conversationId, loggedUserId } = data;

            const conversationParticipants =
                await groupsModel.getGroupParticipants(conversationId);

            // Check if the logged user is part of this group.
            const loggedUserAsParticipant = conversationParticipants.find(
                (p) => p.userId === loggedUserId,
            );

            if (!loggedUserAsParticipant) {
                ctx.addIssue({
                    code: "custom",
                    path: ["loggedUserId"],
                    message: "You are not a part of this group.",
                });
                return;
            }

            // Check if the target user is group participant.
            const participantExists = conversationParticipants.find(
                (p) => p.userId === participantId,
            );

            if (!participantExists) {
                ctx.addIssue({
                    code: "custom",
                    path: ["participantId"],
                    message: "The participant doesn't exist.",
                });
                return;
            }

            // Check if the logged user has the power to remove target user.
            const loggedUserIsOwner = loggedUserAsParticipant.role === "OWNER";
            const loggedUserIsAdmin = loggedUserAsParticipant.role === "ADMIN";

            const targetParticipantIsRegularUser =
                participantExists.role === "USER";

            const loggedUserCanRemoveUser =
                loggedUserIsOwner ||
                (loggedUserIsAdmin && targetParticipantIsRegularUser);

            if (!loggedUserCanRemoveUser) {
                ctx.addIssue({
                    code: "custom",
                    path: ["participantId"],
                    message: "You don't have the power to remove this user.",
                });
            }
        })
        .safeParseAsync({ participantId, conversationId, loggedUserId });
}
