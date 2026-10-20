import { isSameDay, isToday, isYesterday, format } from "date-fns";
import { BeatLoader } from "react-spinners";
import styles from "./FloatingCurrentConversation.module.css";
import classes from "~/css/classes.module.css";
import type { MessageWithAttachmentsAndSenderOmitPassword } from "~/db/message.types";
import type { RootLoaderData } from "~/types/RootLoaderData";
import { useState, useRef, useEffect } from "react";
import { useRouteLoaderData, useFetcher, NavLink } from "react-router";

interface MessagesListProps {
    conversationId: number;
    messages: MessageWithAttachmentsAndSenderOmitPassword[];
    hasMoreMessages: boolean | null;
    nextCursor: number | null;
    onLoadMoreMessages: (
        olderMessages: MessageWithAttachmentsAndSenderOmitPassword[],
    ) => void;
}

export default function MessagesList({
    messages,
    hasMoreMessages: initialHasMoreMessages,
    nextCursor: initialNextCursor,
    conversationId,
    onLoadMoreMessages,
}: MessagesListProps) {
    const { user } = useRouteLoaderData("root") as RootLoaderData;

    const loadMoreMessagesFetcher = useFetcher({
        key: `floating:load-more-messages:${conversationId}`,
    });

    const [hasMoreMessages, setHasMoreMessages] = useState(
        initialHasMoreMessages,
    );

    const [nextCursor, setNextCursor] = useState<number | null>(
        initialNextCursor,
    );

    // Load more messages.
    function loadMoreMessages() {
        loadMoreMessagesFetcher.load(
            `/api/conversations/${conversationId}/messages?cursor=${nextCursor}`,
        );
    }

    useEffect(() => {
        if (!loadMoreMessagesFetcher.data) return;

        if (loadMoreMessagesFetcher.data) {
            const {
                messages: olderMessages,
                hasMoreMessages,
                nextCursor,
            } = loadMoreMessagesFetcher.data;

            onLoadMoreMessages(olderMessages);
            setHasMoreMessages(hasMoreMessages);
            setNextCursor(nextCursor);
        }
    }, [loadMoreMessagesFetcher.data]);
    // ===================

    // When a new message is confirmed, scroll the anchor into view.
    const messagesAnchorRef = useRef<HTMLLIElement | null>(null);

    const lastMessageId = messages[messages.length - 1].id;

    useEffect(() => {
        messagesAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [lastMessageId]);
    // ==============================================================

    if (messages.length === 0) {
        return (
            <div
                className={`
                    ${styles.noMessages}
                    ${classes.flexColumnCenter}
                    `}
            >
                <span
                    className={`
                            material-symbols-rounded
                            ${styles.icon}
                            ${classes.textWithMainColorsGradient}
                        `}
                >
                    inbox
                </span>
                <p
                    className={`
                            ${styles.para}
                            ${classes.textSecondarySmallItalicDimmedCentered}
                        `}
                >
                    This conversation doesn't have messages.
                </p>
            </div>
        );
    }

    return (
        <ul
            className={`
                    ${styles.messages}
                    ${classes.flexColumn}
                `}
        >
            {hasMoreMessages ? (
                loadMoreMessagesFetcher.state === "loading" ? (
                    <li
                        className={`
                                ${styles.wrapper}
                                ${classes.flexRowCenter}
                            `}
                    >
                        <BeatLoader
                            color="var(--color-main)"
                            size={9}
                        />
                    </li>
                ) : (
                    <li className={styles.buttonWrapper}>
                        <button
                            onClick={loadMoreMessages}
                            className={`
                                ${styles.loadMoreMessagesButton}
                                ${classes.flexRowCenter}
                            `}
                        >
                            <span
                                className={`
                        ${styles.text}
                        ${classes.textMainDimmedItalic}
                    `}
                            >
                                Load more messages
                            </span>
                            <span
                                className={`
                        material-symbols-rounded
                        ${styles.icon}
                    `}
                            >
                                sync
                            </span>
                        </button>
                    </li>
                )
            ) : null}
            {messages.map((m, i, displayedMessages) => {
                const previousMessage = i > 0 ? displayedMessages[i - 1] : null;

                const nextMessage =
                    i < displayedMessages.length - 1
                        ? displayedMessages[i + 1]
                        : null;

                const nextMessageIsFromSameUser =
                    nextMessage?.senderId === m.senderId;

                const showDayDate =
                    !previousMessage ||
                    !isSameDay(m.createdAt, previousMessage.createdAt);

                const dayDateFormat = isYesterday(m.createdAt)
                    ? "Yesterday"
                    : isToday(m.createdAt)
                      ? "Today"
                      : format(m.createdAt, "MMMM dd, yyyy");

                const messageTime = format(m.createdAt, "hh:mm b");

                const isLoggedUserMessage = user!.id === m.senderId;

                const senderName = `${m.sender.firstName} ${m.sender.lastName}`;

                const hasAttachment = m.attachments.length > 0;
                const attachment = m.attachments[0];

                return (
                    <li
                        key={m.id}
                        className={`
                                    ${m.deleted ? styles.deleted : ""}
                                    ${styles.message}
                                    ${classes.flexColumn}
                                    ${isLoggedUserMessage ? styles.loggedUserMessage : ""}
                                    ${!nextMessageIsFromSameUser ? styles.extraMarginAtBottom : ""}
                                `}
                    >
                        {showDayDate ? (
                            <p className={styles.dayDate}>{dayDateFormat}</p>
                        ) : null}
                        <div
                            className={`
                                        ${isLoggedUserMessage ? styles.marginRight : styles.marginLeft}
                                        ${styles.contentAndTimeWrapper}
                                        ${classes.flexColumn}
                                    `}
                        >
                            {hasAttachment ? (
                                <img
                                    className={`
                                        ${styles.attachment}
                                        ${classes.correctImage}
                                    `}
                                    src={attachment.fileUrl}
                                    alt={attachment.fileName}
                                />
                            ) : null}
                            <p className={styles.content}>{m.content}</p>
                            <span className={styles.timeDate}>
                                {messageTime}
                            </span>
                        </div>
                        {nextMessageIsFromSameUser ? null : (
                            <NavLink
                                to={`/users/${m.sender.username}`}
                                title={`Go to ${senderName}'s profile`}
                                className={`
                                            ${styles.ppfAndNameWrapper}
                                            ${classes.flexRowStartCenter}
                                        `}
                            >
                                <img
                                    src={m.sender.profilePictureUrl}
                                    alt={senderName}
                                    className={`
                                                ${styles.ppf}
                                                ${classes.profilePictureRound}
                                                ${classes.pictureSmall}
                                                ${classes.correctImage}
                                            `}
                                />
                                <h3
                                    className={`
                                                ${styles.senderName}
                                                ${classes.textSmallSecondary}
                                            `}
                                >
                                    {isLoggedUserMessage ? "You" : senderName}
                                </h3>
                            </NavLink>
                        )}
                    </li>
                );
            })}
            <li
                ref={messagesAnchorRef}
                className={styles.anchor}
            ></li>
        </ul>
    );
}
