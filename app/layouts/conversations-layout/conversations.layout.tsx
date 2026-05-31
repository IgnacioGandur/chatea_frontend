import styles from "./conversation.layout.module.css";
import { Outlet } from "react-router";
import ConversationsSidebar from "~/routes/conversations/conversations-sidebar/ConversationsSidebar";
import { getSession } from "~/session.server";
import type { Route } from "./+types/conversations.layout";
import conversationsModel from "~/db/conversation.model";

export async function loader({ request }: Route.LoaderArgs) {
    const session = await getSession(request.headers.get("Cookie"));

    const userId = session.get("userId");

    if (!userId) {
        throw new Response("Unauthorized", {
            status: 401,
            statusText: "Route only for logged users.",
        });
    }

    const conversations = await conversationsModel.getUserConversations(
        userId,
        null,
    );

    return conversations;
}

export default function ConversationLayout({
    loaderData,
}: Route.ComponentProps) {
    return (
        <main className={styles.conversations}>
            <ConversationsSidebar conversations={loaderData.conversations} />
            <Outlet />
        </main>
    );
}
