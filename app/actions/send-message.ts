import { getSession } from "~/session.server";
import type { Route } from "./+types/send-message";
import validateNewMessage from "~/validators/validateNewMessage";
import conversationModel from "~/db/conversation.model";
import { redirect } from "react-router";
import messageModel from "~/db/message.model";

type FormValues = {
    userAId: string;
    userBId: string;
    message: string;
};

export async function action({ request }: Route.ActionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (!userId) {
        throw new Response("Unauthorized", {
            status: 401,
            statusText: "Only logged users can send messages.",
        });
    }

    const data = await request.formData();
    const values = Object.fromEntries(data) as FormValues;

    values.userAId = userId;

    const validateMessage = await validateNewMessage.safeParseAsync(values);

    if (!validateMessage.success) {
        return {
            success: false,
            message: "We were not able to send your message: ",
            errors: validateMessage.error.issues,
        };
    }

    // Check if there's already a private conversation between the 2 users.
    const conversationExists =
        await conversationModel.getConversationBetweenParticipants(
            userId,
            values.userBId,
        );

    if (conversationExists) {
        await messageModel.create(
            conversationExists.id,
            values.message,
            userId,
        );

        return redirect(`/conversations/${conversationExists.id}`);
    }

    const createdConversation = await conversationModel.create(
        userId,
        values.userBId,
        values.message,
        false,
    );

    return redirect(`/conversations/${createdConversation.id}`);
}
