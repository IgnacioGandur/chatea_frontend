import classes from "~/css/classes.module.css";
import styles from "./FloatingCurrentConversation.module.css";
import { useEffect, useRef } from "react";
import type { SendMessageApiActionResponse } from "~/routes/api.conversations.$id.messages/route";
import { useFetcher } from "react-router";
import type { MessageWithAttachmentsAndSenderOmitPassword } from "~/db/message.types";

interface SendMessageFormProps {
    onMessageSent: (
        newMessage: MessageWithAttachmentsAndSenderOmitPassword,
    ) => void;
    conversationId: number;
}

export default function SendMessageForm({
    onMessageSent,
    conversationId,
}: SendMessageFormProps) {
    const messageInputRef = useRef<HTMLInputElement | null>(null);

    const fetcher = useFetcher<SendMessageApiActionResponse>({
        key: "floating:send-message",
    });

    function sendMessage(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        fetcher.submit(formData, {
            method: "post",
            action: `/api/conversations/${conversationId}/messages`,
        });
    }

    // When the message gets confirmed, attach it to the messages array.
    useEffect(() => {
        if (!fetcher.data?.success) return;

        onMessageSent(fetcher.data.createdMessage);

        if (messageInputRef.current) {
            messageInputRef.current.value = "";
        }
    }, [fetcher.data]);
    // =================================================================

    return (
        <div className={styles.sendMessageFormWrapper}>
            {fetcher.data?.success === false ? (
                <div
                    className={`
                        ${styles.validationErrors}
                        ${classes.flexColumn}
                    `}
                >
                    <h3 className={styles.headerTitle}>
                        {fetcher.data.message}
                    </h3>
                    <ul className={styles.errors}>
                        {fetcher.data.errors.map((e, i) => {
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
            <fetcher.Form
                method="post"
                onSubmit={sendMessage}
                className={`
                    ${styles.sendMessageForm}
                    ${classes.flexRow}
                `}
            >
                <input
                    ref={messageInputRef}
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
                        ${classes.outline1}
                    `}
                    type="submit"
                >
                    <span
                        className={`
                            material-symbols-rounded
                            ${styles.icon}
                        `}
                    >
                        arrow_upward
                    </span>
                </button>
            </fetcher.Form>
        </div>
    );
}
