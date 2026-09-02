import type { GetUserConversations } from "~/db/conversation.types";
import ConversationPreview from "./conversation-preview/ConversationPreview";
import styles from "./ConversationsSidebar.module.css";
import classes from "~/css/classes.module.css";
import { Await, NavLink } from "react-router";
import { Suspense } from "react";

function Skeleton() {
    return (
        <aside className={styles.skeleton}>
            <div
                className={`
                    ${styles.conversations}
                    ${classes.flexColumn}
                `}
            >
                {Array.from({ length: 13 }).map((_, i) => {
                    return (
                        <div
                            key={i}
                            className={`
                                ${styles.skeletonConversation}
                            `}
                        >
                            <div
                                className={`
                                ${styles.skeletonPpf}
                                ${classes.suspenseBackgroundAnimation}
                            `}
                            ></div>
                            <div
                                className={`
                                ${styles.skeletonTitle}
                                ${classes.suspenseBackgroundAnimation}
                            `}
                            ></div>
                            <div
                                className={`
                                ${styles.skeletonMessage}
                                ${classes.suspenseBackgroundAnimation}
                            `}
                            ></div>
                        </div>
                    );
                })}
            </div>
        </aside>
    );
}

interface ConversationsSidebarProps {
    conversationsPromise: Promise<{
        conversations: GetUserConversations[];
        count: number;
    }>;
}

export default function ConversationsSidebar({
    conversationsPromise,
}: ConversationsSidebarProps) {
    //TODO: Update the conversation preview when a message is sent.

    return (
        <aside className={styles.conversationsSidebar}>
            <header
                className={`${styles.header} ${classes.flexRowStartCenter}`}
            >
                <span
                    className={`
                        ${styles.icon}
                        ${classes.iconWithGradientColors}
                        material-symbols-rounded
                    `}
                >
                    conversation
                </span>
                <div className={styles.separator}></div>
                <h2 className={`${classes.titleMedium}`}>Conversations</h2>
            </header>
            <Suspense fallback={<Skeleton />}>
                <Await resolve={conversationsPromise}>
                    {({ conversations }) => {
                        return conversations.length === 0 ? (
                            <div
                                className={`
                                ${styles.noConversations}
                                ${classes.flexColumnCenter}
                                `}
                            >
                                <h4 className={classes.titleMedium}>
                                    No conversations yet...
                                </h4>
                                <NavLink
                                    className={classes.textSmallSecondary}
                                    to="/users"
                                >
                                    Find people to chat with here!
                                </NavLink>
                            </div>
                        ) : (
                            conversations.map((conversation) => {
                                return (
                                    <ConversationPreview
                                        key={conversation.id}
                                        conversation={conversation}
                                    />
                                );
                            })
                        );
                    }}
                </Await>
            </Suspense>
        </aside>
    );
}
