import floatingConversationStyles from "../FloatingConversations.module.css";
import type React from "react";
import classes from "~/css/classes.module.css";
import styles from "./FloatingCurrentConversation.module.css";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFetcher, useRouteLoaderData } from "react-router";
import type { RootLoaderData } from "~/types/RootLoaderData";
import type { GetConversationById } from "~/db/conversation.types";
import type { getConversationByIdInclude } from "~/db/conversation.includes";
import type { Prisma } from "../../../../generated/prisma/client";
import type { LoadMoreMessages } from "~/db/message.types";
import { BeatLoader } from "react-spinners";
import { isYesterday, isToday, format, isSameDay } from "date-fns";
import FloatingConversationHeader from "../floating-conversation-header/FloatingConversationHeader";
import type { SendMessageApiActionResponse } from "~/routes/api.conversations.$id.messages/route";

interface FloatingCurrentConversationProps {
    className?: string;
    conversationId: number | null;
    children: ReactNode;
}

type ConversationType = Prisma.ConversationGetPayload<{
    include: typeof getConversationByIdInclude;
}> | null;

type Message = Prisma.MessageGetPayload<{
    include: {
        attachments: true;
        sender: {
            omit: {
                password: true;
            };
        };
    };
}>;

type MessageFormFields = {
    message: string;
};

export default function FloatingCurrentConversation({
    className,
    conversationId,
    children,
}: FloatingCurrentConversationProps) {
    const { user } = useRouteLoaderData("root") as RootLoaderData;

    // Load the initial data of the conversation.

    const [conversation, setConversation] = useState<ConversationType>(null);
    const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(false);
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);

    const currentConversationFetcher = useFetcher<GetConversationById>({
        key: "floating-current-conversation",
    });

    useEffect(() => {
        currentConversationFetcher.load(
            `/api/conversations/${conversationId}?userId=${user!.id}`,
        );
    }, []);

    useEffect(() => {
        if (currentConversationFetcher && currentConversationFetcher.data) {
            const {
                conversation: fetcherConversation,
                hasMoreMessages,
                nextCursor,
            } = currentConversationFetcher.data;

            const { messages: fetcherMessages } = fetcherConversation;

            setConversation(fetcherConversation);
            setHasMoreMessages(hasMoreMessages);
            setNextCursor(nextCursor);
            setMessages(fetcherMessages.reverse());
        }
    }, [currentConversationFetcher.data]);

    // ==========================================

    // Handle the loading of extra messages.

    const loadMoreMessagesFetcher = useFetcher<LoadMoreMessages>({
        key: "load-more-messages",
    });

    function loadMoreMessages() {
        if (
            hasMoreMessages &&
            nextCursor !== null &&
            conversation &&
            loadMoreMessagesFetcher.state === "idle"
        ) {
            loadMoreMessagesFetcher.load(
                `api/conversations/${conversation.id}/messages?cursor=${nextCursor}`,
            );
        }
    }

    useEffect(() => {
        if (!loadMoreMessagesFetcher.data) return;

        if (loadMoreMessagesFetcher.data) {
            const {
                messages: olderMessages,
                hasMoreMessages,
                nextCursor,
            } = loadMoreMessagesFetcher.data;

            setMessages((currentMessages) => [
                ...olderMessages,
                ...currentMessages,
            ]);
            setHasMoreMessages(hasMoreMessages);
            setNextCursor(nextCursor);
        }
    }, [loadMoreMessagesFetcher.data]);

    // =====================================

    // Handle the sending of messages.

    const sendMessageFetcher = useFetcher<SendMessageApiActionResponse>({
        key: "send-message",
    });

    const sendMessageFormRef = useRef<HTMLFormElement | null>(null);

    useEffect(() => {
        if (
            sendMessageFetcher &&
            sendMessageFetcher.data &&
            sendMessageFormRef.current
        ) {
            sendMessageFormRef.current.reset();
        }
    }, [sendMessageFetcher.data]);

    function sendMessage(e: React.SubmitEvent<HTMLFormElement>) {
        const form = e.currentTarget;
        const formData = new FormData(form);
        const formValues = Object.fromEntries(formData) as MessageFormFields;

        sendMessageFetcher.submit(formValues);
    }

    const sendMessageHasError = sendMessageFetcher.data?.success === false;

    const sendMessageErrorTitle =
        sendMessageFetcher.data?.success === false
            ? sendMessageFetcher.data.message
            : null;

    const sendMessageErrorsArray =
        sendMessageFetcher.data?.success === false
            ? sendMessageFetcher.data.errors
            : null;

    // ===============================

    if (!user) return;

    if (!conversation && currentConversationFetcher.state === "loading") {
        return <Skeleton className={className}>{children}</Skeleton>;
    }

    if (!conversation) {
        return <NoConversation>{children}</NoConversation>;
    }

    const isGroup = conversation.isGroup;

    const userB = isGroup
        ? null
        : conversation.participants.find((p) => p.userId !== user.id);

    const ppf = isGroup
        ? conversation.profilePicture
        : userB!.user.profilePictureUrl;

    const title = isGroup
        ? conversation.title
        : `${userB!.user.firstName} ${userB!.user.lastName}`;

    return (
        <div
            className={`
                ${floatingConversationStyles.positionAbsoluteBottomRight}
                ${floatingConversationStyles.roundedCorners}
                ${classes.flexColumn}
                ${styles.currentConversation}
            `}
        >
            <div
                className={`
                ${styles.header}
                ${classes.flexRow}
            `}
            >
                <div
                    className={`
                    ${styles.userB}
                    ${classes.flexRowStartCenter}
                `}
                >
                    <img
                        src={ppf || ""}
                        alt={title || ""}
                        className={`
                            ${styles.ppf}
                            ${classes.profilePictureRound}
                            ${classes.correctImage}
                            ${classes.pictureSmall}
                        `}
                    />
                    <h2
                        className={`
                            ${styles.name}
                            ${classes.ellipsisOnOverflowingText}
                        `}
                    >
                        {title}
                    </h2>
                </div>
                <div
                    className={`
                    ${styles.buttons}
                    ${classes.flexRowStartCenter}
                `}
                >
                    {children}
                </div>
            </div>
            {sendMessageHasError &&
            sendMessageErrorsArray &&
            sendMessageErrorTitle ? (
                <div className={styles.validationErrors}>
                    <h3 className={styles.title}>{sendMessageErrorTitle}</h3>
                    <ul
                        className={`
                            ${styles.errors}
                            ${classes.flexColumn}
                        `}
                    >
                        {sendMessageErrorsArray.map((e, i) => {
                            return (
                                <li
                                    key={i}
                                    className={styles.error}
                                >
                                    {e.message}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : null}
            {hasMoreMessages ? (
                loadMoreMessagesFetcher.state === "loading" ? (
                    <div
                        className={`
                        ${styles.wrapper}
                        ${classes.flexRowCenter}
                    `}
                    >
                        <BeatLoader
                            color="var(--color-main)"
                            size={9}
                        />
                    </div>
                ) : (
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
                )
            ) : null}
            <div
                className={`
                    ${styles.messages}
                    ${classes.flexColumn}
                `}
            >
                {conversation.messages.length === 0 ? (
                    <p className={styles.noMessages}>No messages.</p>
                ) : (
                    messages.map((m, i, displayedMessages) => {
                        const previousMessage =
                            i > 0 ? displayedMessages[i - 1] : null;

                        const nextMessage =
                            i < displayedMessages.length - 1
                                ? displayedMessages[i + 1]
                                : null;

                        // NOTE: Use this to render the profile picture of the sender.
                        const nextMessageIsFromSameUser =
                            nextMessage?.senderId === m.senderId;

                        const isCurrentMessageAndNextMessageTheSameDay =
                            nextMessage &&
                            isSameDay(m.createdAt, nextMessage.createdAt);

                        const showDayDate =
                            (!previousMessage && !hasMoreMessages) ||
                            !isCurrentMessageAndNextMessageTheSameDay;

                        const dayDateFormat = isToday(m.createdAt)
                            ? "Today"
                            : isYesterday(m.createdAt)
                              ? "Yesterday"
                              : format(m.createdAt, "MMMM dd, yyyy");

                        const messageTime = format(m.createdAt, "hh:mm b");

                        const isLoggedUserMessage = user.id === m.senderId;

                        const senderName = `${m.sender.firstName} ${m.sender.lastName}`;

                        return (
                            <div
                                key={m.id}
                                className={`
                                    ${m.deleted ? styles.deleted : ""}
                                    ${styles.message}
                                    ${classes.flexColumn}
                                    ${isLoggedUserMessage ? styles.loggedUserMessage : ""}
                                `}
                            >
                                {showDayDate ? (
                                    <p className={styles.dayDate}>
                                        {dayDateFormat}
                                    </p>
                                ) : null}
                                <div
                                    className={`
                                        ${styles.contentAndTimeWrapper}
                                        ${classes.flexColumn}
                                    `}
                                >
                                    <p className={styles.content}>
                                        {m.content}
                                    </p>
                                    <span className={styles.timeDate}>
                                        {messageTime}
                                    </span>
                                </div>
                                <h3 className={styles.senderName}>
                                    {isLoggedUserMessage ? "You" : senderName}
                                </h3>
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
                            </div>
                        );
                    })
                )}
                <div className={styles.anchor}></div>
            </div>
            <sendMessageFetcher.Form
                ref={sendMessageFormRef}
                onSubmit={sendMessage}
                method="post"
                action={`/api/conversations/${conversation!.id}/messages`}
                className={`
                    ${styles.sendMessageForm}
                    ${classes.flexRow}
                `}
            >
                <input
                    className={`
                        ${styles.input}
                        ${classes.outline1}
                    `}
                    type="text"
                    name="message"
                    placeholder="Write your message..."
                />
                <button
                    className={`
                        ${styles.sendMessageButton}
                        ${classes.gridCenter}
                    `}
                    type="submit"
                >
                    <span
                        className={`
                            material-symbols-rounded
                            ${styles.icon}
                        `}
                    >
                        upload
                    </span>
                </button>
            </sendMessageFetcher.Form>
        </div>
    );
}

interface SkeletonProps {
    className?: string;
    children: ReactNode;
}

function Skeleton({ className, children }: SkeletonProps) {
    return (
        <div
            className={`
                ${styles.skeleton}
                ${classes.flexColumn}
                ${className ?? ""}
            `}
        >
            <div
                className={`
                    ${styles.header}
                    ${classes.flexRowJustifySpaceBetween}
                `}
            >
                <div
                    className={`
                        ${styles.userB}
                        ${classes.flexRowStartCenter}
                    `}
                >
                    <div
                        className={`
                                ${styles.ppf}
                                ${classes.pictureMedium}
                                ${classes.correctImage}
                                ${classes.suspenseBackgroundAnimation}
                                ${classes.profilePictureRound}
                            `}
                    ></div>
                    <div
                        className={`
                            ${styles.name}
                            ${classes.suspenseBackgroundAnimation}
                        `}
                    ></div>
                </div>
                <div
                    className={`
                        ${styles.buttons}
                        ${classes.flexRowStartCenter}
                    `}
                >
                    {children}
                </div>
            </div>
            <div
                className={`
                    ${styles.messages}
                    ${classes.flexColumn}
                `}
            >
                {Array.from({ length: 11 }).map((_, i) => {
                    return (
                        <div
                            key={i}
                            className={`
                                ${styles.message}
                                ${classes.suspenseBackgroundAnimation}
                            `}
                        ></div>
                    );
                })}
            </div>
            <p
                className={`
                        ${styles.para}
                        ${classes.textSecondarySmallItalicDimmedCentered}
                    `}
            >
                Fetching conversation...
            </p>
        </div>
    );
}

interface NoConversationProps {
    children: ReactNode;
}

function NoConversation({ children }: NoConversationProps) {
    return (
        <div
            className={`
                ${floatingConversationStyles.positionAbsoluteBottomRight}
                ${floatingConversationStyles.roundedCorners}
                ${styles.noConversation}
            `}
        >
            <FloatingConversationHeader>{children}</FloatingConversationHeader>
            <div
                className={`
                    ${styles.wrapper}
                    ${classes.gridCenter}
                `}
            >
                <p
                    className={`
                        ${classes.textSecondarySmallItalicDimmedCentered}
                        ${styles.para}
                    `}
                >
                    We were not able to fetch this conversation.
                </p>
            </div>
        </div>
    );
}

// NOTE: This goes in the skeleton header.
