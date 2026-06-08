import type { GetUserConversations } from "~/db/conversation.types";
import styles from "./ConversationPreview.module.css";
import classes from "~/css/classes.module.css";
import { NavLink, useRouteLoaderData } from "react-router";
import { formatDistanceToNow } from "date-fns";
import avatar from "/images/avatar.png";
import NavLinkLoader from "~/components/navlink-loader/NavLinkLoader";
import type { RootLoaderData } from "~/types/RootLoaderData";

interface ConversationPreviewProps {
    conversation: GetUserConversations;
}

export default function ConversationPreview({
    conversation,
}: ConversationPreviewProps) {
    const { user: loggedUser } = useRouteLoaderData("root") as RootLoaderData;
    const isGroup = conversation.isGroup;

    const userB = conversation.participants.find(
        (p) => p.userId !== loggedUser!.id,
    )?.user;

    const userBName = `${userB?.firstName} ${userB?.lastName}`;
    const title = isGroup ? conversation.title : userBName;
    const ppf = isGroup
        ? conversation.profilePicture
        : userB?.profilePictureUrl;

    const titleElement = (
        <h4
            className={`
            ${classes.ellipsisOnOverflowingText}
            ${classes.titleSmallMainFont}
        `}
        >
            {title}
        </h4>
    );

    return (
        <NavLink
            to={`/conversations/${conversation.id}`}
            className={({ isActive, isPending }) => {
                return isPending
                    ? `${classes.flexRowStartCenter} ${classes.disabledLink}`
                    : isActive
                      ? `${styles.conversationPreview} ${styles.active}`
                      : styles.conversationPreview;
            }}
        >
            {({ isPending }) => {
                return isPending ? (
                    <NavLinkLoader
                        style={{ borderBottom: "1px solid var(--color-line)" }}
                        message="Loading conversation..."
                    />
                ) : (
                    <>
                        <img
                            src={ppf || avatar}
                            alt="Profile picture"
                            className={`${classes.profilePictureRound} ${styles.ppf}`}
                        />
                        <div className={styles.titleAndDate}>
                            {isGroup ? (
                                <div
                                    className={`${styles.groupTitle} ${classes.flexRowStartCenter}`}
                                >
                                    <span
                                        title="Group conversation"
                                        aria-label="This is a group conversation"
                                        className={`
                                            ${styles.icon}
                                            ${classes.iconWithGradientColors}
                                            material-symbols-rounded
                                        `}
                                    >
                                        group
                                    </span>
                                    <div
                                        className={classes.ballSeparator}
                                    ></div>
                                    {titleElement}
                                </div>
                            ) : (
                                titleElement
                            )}
                            {conversation.lastMessageAt ? (
                                <span
                                    className={`${styles.lastMessageAt} ${classes.ellipsisOnOverflowingText}`}
                                >
                                    {formatDistanceToNow(
                                        conversation.lastMessageAt,
                                        {
                                            addSuffix: true,
                                        },
                                    )}
                                </span>
                            ) : null}
                        </div>
                        {conversation.messages.length === 0 ? (
                            <p className={styles.lastMessageContent}>
                                No messages.
                            </p>
                        ) : (
                            conversation.messages.map((m) => {
                                return (
                                    <div
                                        key={m.id}
                                        className={styles.lastMessageContent}
                                    >
                                        {loggedUser!.id === m.senderId ? (
                                            <span className={styles.you}>
                                                You:
                                            </span>
                                        ) : null}
                                        <p
                                            className={
                                                classes.ellipsisOnOverflowingText
                                            }
                                        >
                                            {m.content}
                                        </p>
                                    </div>
                                );
                            })
                        )}
                    </>
                );
            }}
        </NavLink>
    );
}
