import type { GetUserConversations } from "~/db/conversation.types";
import ConversationPreview from "./conversation-preview/ConversationPreview";
import styles from "./ConversationsSidebar.module.css";
import { NavLink } from "react-router";

interface ConversationsSidebarProps {
    conversations: GetUserConversations[];
}

export default function ConversationsSidebar({
    conversations,
}: ConversationsSidebarProps) {
    return conversations.length === 0 ? (
        <aside className={`${styles.sidebar} ${styles.noConversations}`}>
            <h4>You don't have any conversations yet...</h4>
            <NavLink
                className={styles.link}
                to="/users"
            >
                Find people to chat with here!
            </NavLink>
        </aside>
    ) : (
        <aside className={styles.sidebar}>
            {conversations.map((conversation) => {
                return (
                    <ConversationPreview
                        key={conversation.id}
                        conversation={conversation}
                    />
                );
            })}
        </aside>
    );
}
