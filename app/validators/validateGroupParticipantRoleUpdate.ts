import * as z from "zod";
import groupsModel from "~/db/groups.model";

function errorMessage(type: string, field: string, received: string) {
    return `Expected: '${type}' in '${field}'. Received: '${received}'.`;
}

export async function validateGroupParticipantRoleUpdate(
    participantId: number,
    conversationId: number,
    loggedUserId: number,
    role: "USER" | "ADMIN",
) {
    return await z
        .object({
            conversationId: z.number({
                error: (issue) =>
                    errorMessage(
                        "number",
                        "conversationId",
                        String(issue.input),
                    ),
            }),
            participantId: z.number({
                error: (issue) =>
                    errorMessage(
                        "number",
                        "participantId",
                        String(issue.input),
                    ),
            }),
            loggedUserId: z.number({
                error: (issue) =>
                    errorMessage("number", "loggedUserId", String(issue.input)),
            }),
            role: z.enum(["USER", "ADMIN"]),
        })
        .superRefine(async (data, ctx) => {
            const { conversationId, participantId, loggedUserId } = data;

            const conversationParticipants =
                await groupsModel.getGroupParticipants(conversationId);

            // Check if logged user is group owner.
            const conversationOwner = conversationParticipants.find(
                (p) => p.role === "OWNER",
            );

            const loggedUserIsOwner =
                conversationOwner!.userId === loggedUserId;

            if (!loggedUserIsOwner) {
                ctx.addIssue({
                    code: "custom",
                    path: ["loggedUserId"],
                    message: "Only the group owner can perform this action.",
                });
            }

            // Check if target user exists and if it's a participant in the conversation.
            const targetUserIsParticipant = conversationParticipants.find(
                (p) => p.userId === participantId,
            );

            if (!targetUserIsParticipant) {
                ctx.addIssue({
                    code: "custom",
                    path: ["participantId"],
                    message: "User is not a part of this conversation.",
                });
            }
        })
        .safeParseAsync({
            participantId,
            conversationId,
            loggedUserId,
            role,
        });
}
