import styles from "./MessagesList.module.css";
import SingleMessage from "../single-message/SingleMessage";
import EmptySection from "~/components/empty-section/EmptySection";
import type { Prisma } from "../../../../../../generated/prisma/client";
import parentStyles from "../CurrentConversation.module.css";

interface MessagesListProps {
    messages: Prisma.MessageGetPayload<{
        include: {
            attachments: true;
            sender: true;
        };
    }>[];
}

export function MessagesList({ messages }: MessagesListProps) {
    return messages.length === 0 || !messages ? (
        <EmptySection
            className={parentStyles.emptyMessages}
            message="No messages in this conversation."
            icon="chat_dashed"
            linkPath="/"
        />
    ) : (
        <ul className={parentStyles.messages}>
            {messages.map((m, i) => {
                const nextMessageIsFromSameUser =
                    messages[i + 1]?.senderId === m.senderId;

                return (
                    <SingleMessage
                        nextMessageIsFromSameUser={nextMessageIsFromSameUser}
                        key={m.id}
                        message={m}
                    />
                );
            })}
        </ul>
    );
}
