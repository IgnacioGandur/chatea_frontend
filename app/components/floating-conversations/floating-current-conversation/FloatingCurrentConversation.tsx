import SendMessageForm from "./SendMessageForm";
import Skeleton from "./Skeleton";
import floatingConversationStyles from "../FloatingConversations.module.css";
import classes from "~/css/classes.module.css";
import styles from "./FloatingCurrentConversation.module.css";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFetcher, useRouteLoaderData } from "react-router";
import type { RootLoaderData } from "~/types/RootLoaderData";
import type { GetConversationById } from "~/db/conversation.types";
import type { getConversationByIdInclude } from "~/db/conversation.includes";
import type { Prisma } from "../../../../generated/prisma/client";
import NoConversation from "./NoConversation";
import MessagesList from "./MessagesList";
import type { MessageWithAttachmentsAndSenderOmitPassword } from "~/db/message.types";
import deduplicateMessages from "./deduplicateMessages";

interface FloatingCurrentConversationProps {
    className?: string;
    conversationId: number | null;
    children: ReactNode;
}

type ConversationType = Prisma.ConversationGetPayload<{
    include: typeof getConversationByIdInclude;
}> | null;

export default function FloatingCurrentConversation({
    className,
    conversationId,
    children,
}: FloatingCurrentConversationProps) {
    const { user } = useRouteLoaderData("root") as RootLoaderData;

    const [conversation, setConversation] = useState<ConversationType>(null);

    const [messages, setMessages] = useState<
        MessageWithAttachmentsAndSenderOmitPassword[]
    >([]);

    const [hasLoadedConversation, setHasLoadedConversation] = useState(false);

    const fetcher = useFetcher<GetConversationById>({
        key: `floating:current-conversation:${conversationId}`,
    });

    // Use this ref as a one-way-switch to keep track of the 'idle' state after the initial data fetch.
    const sawLoadingRef = useRef(false);

    // Fetch the current conversation using it's ID and set the reset the
    // state variables.
    useEffect(() => {
        sawLoadingRef.current = false;

        setHasLoadedConversation(false);
        setConversation(null);
        setMessages([]);

        if (!conversationId) return;

        fetcher.load(`/api/conversations/${conversationId}`);
    }, [conversationId]);
    // ===============================================================================

    // When the data arrives from the API endpoint, set them in the state variables.
    useEffect(() => {
        // When the fetch triggers, turn the one-way-switch- on.
        if (fetcher.state === "loading") {
            sawLoadingRef.current = true;
            return;
        }

        if (!sawLoadingRef.current) return;
        if (hasLoadedConversation) return;
        if (!conversationId) return;

        const data = fetcher.data;

        // Prevent a stale replacement of data.
        if (data?.conversation && data.conversation.id !== conversationId)
            return;

        setConversation(data?.conversation ?? null);
        setMessages(
            data?.conversation ? [...data.conversation.messages].reverse() : [],
        );
        setHasLoadedConversation(true);
    }, [fetcher.state, fetcher.data, conversationId, hasLoadedConversation]);
    // ============================================================================

    function onMessageSent(
        newMessage: MessageWithAttachmentsAndSenderOmitPassword,
    ) {
        setMessages((olderMessages) => {
            return deduplicateMessages(olderMessages, [newMessage]);
        });
    }

    function onLoadMoreMessages(
        olderMessages: MessageWithAttachmentsAndSenderOmitPassword[],
    ) {
        setMessages((currentMessages) => {
            return deduplicateMessages(olderMessages, currentMessages);
        });
    }

    if (!user) return;

    if (!hasLoadedConversation) {
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
            <MessagesList
                key={conversationId}
                onLoadMoreMessages={onLoadMoreMessages}
                conversationId={conversationId!}
                messages={messages}
                hasMoreMessages={fetcher.data!.hasMoreMessages}
                nextCursor={fetcher.data!.nextCursor}
            />
            <SendMessageForm
                onMessageSent={onMessageSent}
                conversationId={conversationId!}
            />
        </div>
    );
}
