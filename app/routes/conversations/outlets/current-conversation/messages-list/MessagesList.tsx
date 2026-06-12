import styles from "./MessagesList.module.css";
import SingleMessage from "../single-message/SingleMessage";
import EmptySection from "~/components/empty-section/EmptySection";
import type { Participant, Prisma } from "~/../generated/prisma/client";
import parentStyles from "../CurrentConversation.module.css";
import type { FetcherWithComponents } from "react-router";

interface MessagesListProps {
    conversationIsGroup: boolean;
    participants: Participant[];
    messages: Prisma.MessageGetPayload<{
        include: {
            attachments: true;
            sender: true;
        };
    }>[];
}

export function MessagesList({
    conversationIsGroup,
    messages,
    participants,
}: MessagesListProps) {
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
                        conversationIsGroup={conversationIsGroup}
                        participants={participants}
                        nextMessageIsFromSameUser={nextMessageIsFromSameUser}
                        key={m.id}
                        message={m}
                    />
                );
            })}
        </ul>
    );
}
