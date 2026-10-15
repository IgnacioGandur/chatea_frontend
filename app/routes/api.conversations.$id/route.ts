import conversationModel from "~/db/conversation.model";
import type { Route } from "./+types/route";

export async function loader({ params, url }: Route.LoaderArgs) {
    const { id: conversationId } = params;
    const userId = url.searchParams.get("userId");

    if (!conversationId) return "You need to provide a conversation ID.";
    if (!userId) return "You need to provide the user ID.";

    const conversation = await conversationModel.getConversationById(
        userId,
        conversationId,
    );

    return conversation;
}
