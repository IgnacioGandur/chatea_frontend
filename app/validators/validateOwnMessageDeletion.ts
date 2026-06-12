import * as z from "zod";
import messageModel from "~/db/message.model";

function numberErrorMessage(field: string): string {
    return `${field} field should be a number.`;
}

export async function validateOwnMessageDeletion(
    messageId: number,
    loggedUserId: number,
) {
    return z
        .object({
            messageId: z.number({
                error: () => numberErrorMessage("Message ID"),
            }),
            loggedUserId: z.number({
                error: () => numberErrorMessage("Logged user ID"),
            }),
        })
        .superRefine(async (data, ctx) => {
            const { messageId, loggedUserId } = data;
            const message = await messageModel.getMessageById(messageId);

            if (!message) {
                ctx.addIssue({
                    code: "custom",
                    path: ["messageId"],
                    message:
                        "The message you are trying to delete doesn't exist.",
                });
            }

            const loggedUserIsMessageOwner = message?.senderId === loggedUserId;

            if (!loggedUserIsMessageOwner) {
                ctx.addIssue({
                    code: "custom",
                    path: ["loggedUserId"],
                    message: "Only the message owner can delete this message.",
                });
            }
        })
        .safeParseAsync({ messageId, loggedUserId });
}
