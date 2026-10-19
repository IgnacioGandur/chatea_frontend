import conversationModel from "~/db/conversation.model";
import type { Route } from "./+types/route";
import { getLoggedUserId } from "~/utils/getLoggedUserId";
import type { GetConversationById } from "~/db/conversation.types";

export type GetConversationByIdResponse = GetConversationById | null;

export async function loader({ request, params }: Route.LoaderArgs) {
    const { id: conversationId } = params;
    const { loggedUserId: userId } = await getLoggedUserId(request);

    if (!conversationId) {
        console.error("You need to provide a conversation ID.");
        return null;
    }

    if (!userId) {
        console.error("You need to provide the user ID.");
        return null;
    }

    const conversation = await conversationModel.getConversationById(
        userId,
        conversationId,
    );

    return conversation;
}
