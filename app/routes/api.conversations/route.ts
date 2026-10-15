import { getLoggedUserId } from "~/utils/getLoggedUserId";
import type { Route } from "./+types/route";
import conversationModel from "~/db/conversation.model";

export async function loader({ request }: Route.LoaderArgs) {
    const { loggedUserId } = await getLoggedUserId(request);

    if (!loggedUserId) {
        return null;
    }

    const conversations = await conversationModel.getUserConversations(
        Number(loggedUserId),
        null,
    );

    return conversations;
}
