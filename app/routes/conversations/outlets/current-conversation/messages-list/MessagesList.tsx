import styles from "./MessagesList.module.css";
import currentConversationStyles from "../CurrentConversation.module.css";
import type { Message } from "../../../../../../generated/prisma/client";
import { useEffect, useRef, useState } from "react";
import { useFetcher, useParams, useRouteLoaderData } from "react-router";
import type { RootLoaderData } from "~/types/RootLoaderData";
import { v4 as uuidv4 } from "uuid";

interface InitialData {
    messages: Message[];
    nextCursor: number | null;
    hasMoreMessages: boolean;
}

interface MessagesListProps {
    initialData: InitialData;
}

type OptimisticMessage = Omit<Message, "id"> & {
    temporaryId: string;
    id: string | number;
};

export default function MessagesList(props: MessagesListProps) {
    const { id } = useParams();
    const { user } = useRouteLoaderData("root") as RootLoaderData;

    const sendMessageFetcher = useFetcher<{
        success: boolean;
        createdMessage: Message;
        temporaryId: string;
    }>({ key: "send-message" });

    const loadMoreMessagesFetcher = useFetcher<{
        messages: Message[];
        hasMoreMessages: boolean;
        nextCursor: number | null;
    }>();

    const [messages, setMessages] = useState<Message[]>(
        props.initialData.messages,
    );

    const [optimisticMessages, setOptimisticMessages] = useState<
        OptimisticMessage[]
    >([]);

    // Once the optimisitic message is confirmed, synchronize the 'messages' state.
    useEffect(() => {
        const createdMessage = sendMessageFetcher.data?.createdMessage;
        const optimisticIsNotSubmitting =
            sendMessageFetcher.state !== "submitting";

        if (createdMessage && optimisticIsNotSubmitting) {
            setMessages((prev) => {
                const array = [createdMessage, ...prev];
                const map = new Map<number, Message>();

                array.forEach((m) => map.set(m.id, m));

                return [...map.values()];
            });
        }
    }, [sendMessageFetcher.data]);

    const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(
        props.initialData.hasMoreMessages,
    );

    const [nextCursor, setNextCursor] = useState<number | null>(
        props.initialData.nextCursor,
    );

    // Handle older messages.
    function loadMoreMessages() {
        const url = `/api/conversations/${id}/messages?cursor=${nextCursor}`;
        loadMoreMessagesFetcher.load(url);
    }

    useEffect(() => {
        if (loadMoreMessagesFetcher && loadMoreMessagesFetcher.data) {
            const newMessages = loadMoreMessagesFetcher.data.messages;
            const nextCursor = loadMoreMessagesFetcher.data.nextCursor;
            const hasMoreMessages =
                loadMoreMessagesFetcher.data.hasMoreMessages;

            setNextCursor(nextCursor);
            setHasMoreMessages(hasMoreMessages);

            setMessages((prev) => {
                const array = [...prev, ...[...newMessages].reverse()];
                const map = new Map<number, Message>();

                array.forEach((m) => map.set(m.id, m));

                return [...map.values()];
            });
        }
    }, [loadMoreMessagesFetcher.data]);

    // ----------------------------------

    // Scroll to bottom of the messages container when the user sends a
    // messages.
    const messagesContainerRef = useRef<HTMLUListElement | null>(null);

    useEffect(() => {
        const isSendingMessage =
            sendMessageFetcher.state !== "idle" &&
            sendMessageFetcher.formData?.has("message");

        if (isSendingMessage && messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [sendMessageFetcher.data]);

    // ----------------------------------

    // Handle optimistic messages.
    useEffect(() => {
        const isSubmitting = sendMessageFetcher.state === "submitting";

        if (isSubmitting) {
            const optimistic = {
                temporaryId: sendMessageFetcher.formData!.get(
                    "temporaryId",
                ) as string,
                id: `optimistic-${uuidv4()}`,
                conversationId: Number(id),
                senderId: user!.id,
                content: sendMessageFetcher.formData?.get("message") as string,
                isRead: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                deleted: false,
            };

            setOptimisticMessages((prev) => [...prev, optimistic]);
        }
    }, [sendMessageFetcher.state]);

    // ----------------------------------

    const displayedMessages: (Message | OptimisticMessage)[] = [
        ...[...messages].reverse(),
        ...optimisticMessages,
    ];

    return displayedMessages.length === 0 ? (
        <section
            className={`
                ${styles.emptyMessages}
                ${currentConversationStyles.messages}
            `}
        >
            <h1>Empty messages</h1>
        </section>
    ) : (
        <ul
            ref={messagesContainerRef}
            className={`
                ${styles.messages}
                ${currentConversationStyles.messages}
            `}
        >
            {hasMoreMessages ? (
                <button onClick={loadMoreMessages}>Load more</button>
            ) : null}
            {displayedMessages.map((m) => {
                return (
                    <li
                        key={m.id}
                        className={`
                            ${styles.message}
                            ${String(m.id).includes("optimistic") ? styles.optimistic : ""}
                        `}
                    >
                        <span>{m.content}</span>
                    </li>
                );
            })}
        </ul>
    );
}
