import * as z from "zod";
import groupsModel from "~/db/groups.model";
import { checkIfMessageExists } from "./custom-validators/checkIfMessageExists";

export async function validateGroupMessageDeletion(
    senderId: number,
    conversationId: number,
    messageId: number,
    loggedUserId: number,
) {
    return await z
        .object({
            senderId: z.number("Sender ID should be a number."),
            conversationId: z.number("Conversation ID should be a number."),
            messageId: z
                .number("Message ID should be a number.")
                .refine(checkIfMessageExists, {
                    error: "The message you are trying to delete doesn't exist.",
                }),
            loggedUserId: z.number("Logged user ID should be a number."),
        })
        .superRefine(async (data, ctx) => {
            const { conversationId, loggedUserId, senderId } = data;

            const groupParticipants =
                await groupsModel.getGroupParticipants(conversationId);

            const loggedUserAsParticipant = groupParticipants.find(
                (p) => p.userId === loggedUserId,
            );

            if (!loggedUserAsParticipant) {
                ctx.addIssue({
                    code: "custom",
                    path: ["loggedUserId"],
                    message: "You are not a part of this conversation.",
                });
                return;
            }

            const messageSenderAsParticipant = groupParticipants.find(
                (p) => p.userId === senderId,
            );

            if (!messageSenderAsParticipant) {
                ctx.addIssue({
                    code: "custom",
                    path: ["senderId"],
                    message: "Participant doesn't exist on this conversation.",
                });
                return;
            }

            // Logged user can delete a message only if they are group
            // owner or admin and the message sender has a regular role.
            const canLoggedUserDeleteMessage =
                loggedUserAsParticipant.role === "OWNER" ||
                (loggedUserAsParticipant.role === "ADMIN" &&
                    messageSenderAsParticipant.role === "USER");

            if (!canLoggedUserDeleteMessage) {
                ctx.addIssue({
                    code: "custom",
                    path: ["loggedUserId"],
                    message: "You don't have the role to delete this message.",
                });
                return;
            }
        })
        .safeParseAsync({
            senderId,
            conversationId,
            messageId,
            loggedUserId,
        });
}
