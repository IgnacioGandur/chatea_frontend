import * as z from "zod";
import conversationModel from "~/db/conversation.model";

export async function validateConversationById(
    conversationId: number,
    loggedUserId: number,
) {
    return await z
        .object({ conversationId: z.number(), loggedUserId: z.number() })
        .superRefine(async (data, ctx) => {
            const { conversationId, loggedUserId } = data;
            const conversation = await conversationModel.get(conversationId);

            if (!conversation) {
                ctx.addIssue({
                    code: "custom",
                    path: ["conversationId"],
                    message: "The conversation doesnt' exist.",
                });

                return;
            }

            const loggedUserAsParticipant = conversation.participants.find(
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
        })
        .safeParseAsync({ conversationId, loggedUserId });
}
