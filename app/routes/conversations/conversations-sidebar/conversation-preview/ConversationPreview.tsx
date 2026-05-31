import type { GetUserConversations } from "~/db/conversation.types";
import type { User } from "../../../../../generated/prisma/client";
import styles from "./ConversationPreview.module.css";
import { NavLink, useRouteLoaderData } from "react-router";
import { formatDistanceToNow } from "date-fns";
import avatar from "/images/avatar.png";

interface ConversationPreviewProps {
    conversation: GetUserConversations;
}

export default function ConversationPreview({
    conversation,
}: ConversationPreviewProps) {
    const loggedUser = useRouteLoaderData("root") as User;
    const isGroup = conversation.isGroup;

    const userB = conversation.participants.find(
        (p) => p.userId !== loggedUser.id,
    )?.user;

    const title = userB
        ? `${userB.firstName} ${userB.lastName}`
        : conversation.title;

    const ppf = userB ? userB.profilePictureUrl : conversation.profilePicture;

    return (
        <NavLink
            to={`/conversations/${conversation.id}`}
            className={({ isActive, isPending }) => {
                return isActive
                    ? `${styles.conversationPreview} ${styles.active}`
                    : isPending
                      ? `${styles.conversationPreview} ${styles.pending}`
                      : styles.conversationPreview;
            }}
        >
            {isGroup ? (
                <span className={`material-symbols-rounded ${styles.icon}`}>
                    group
                </span>
            ) : null}
            <img
                src={ppf || avatar}
                alt="Profile picture"
                className={styles.ppf}
            />
            <div className={styles.titleAndDate}>
                <h4 className={styles.title}>{title}</h4>
                {conversation.lastMessageAt ? (
                    <span className={styles.lastMessageAt}>
                        {formatDistanceToNow(conversation.lastMessageAt, {
                            addSuffix: true,
                        })}
                    </span>
                ) : null}
            </div>
            {conversation.messages.map((m) => {
                return (
                    <div
                        key={m.id}
                        className={styles.lastMessageContent}
                    >
                        {loggedUser.id === m.senderId ? (
                            <span className={styles.you}>You:</span>
                        ) : null}
                        <p className={styles.content}>{m.content}</p>
                    </div>
                );
            })}
        </NavLink>
    );
}
