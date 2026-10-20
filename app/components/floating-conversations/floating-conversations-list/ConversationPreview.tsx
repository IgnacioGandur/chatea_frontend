import classes from "~/css/classes.module.css";
import styles from "./FloatingConversationsList.module.css";

interface ConversationPreviewProps {
    isGroup: boolean;
    lastMessageSenderText: string | null;
    profilePictureUrl: string;
    name: string;
    lastMessage: string;
    date: string;
    setCurrentConversation: () => void;
}

export default function ConversationPreview({
    isGroup,
    lastMessageSenderText,
    profilePictureUrl,
    name,
    lastMessage,
    date,
    setCurrentConversation,
}: ConversationPreviewProps) {
    return (
        <button
            onClick={() => setCurrentConversation()}
            className={`
                ${styles.conversationPreview}
            `}
        >
            <img
                src={profilePictureUrl}
                alt={name}
                className={`
                    ${styles.ppf}
                    ${classes.correctImage}
                    ${classes.profilePictureRound}
                    ${classes.pictureMedium}
                `}
            />
            <div
                className={`
                    ${styles.nameWrapper}
                    ${classes.flexRowStartCenter}
                `}
            >
                {isGroup ? (
                    <span
                        title="Group conversation"
                        className={`
                            material-symbols-rounded
                            ${classes.textWithMainColorsGradient}
                            ${styles.groupIcon}
                        `}
                    >
                        group
                    </span>
                ) : null}
                <h2
                    className={`
                    ${styles.name}
                    ${classes.ellipsisOnOverflowingText}
                `}
                >
                    {name}
                </h2>
            </div>
            <div
                className={`
                    ${styles.wrapper}
                    ${classes.flexRowStartCenter}
                `}
            >
                {lastMessageSenderText ? (
                    <span
                        className={`
                            ${styles.lastMessageSenderText}
                            ${classes.ellipsisOnOverflowingText}
                        `}
                    >
                        {lastMessageSenderText}
                    </span>
                ) : null}
                <p
                    className={`
                        ${styles.lastMessage}
                        ${classes.ellipsisOnOverflowingText}
                    `}
                >
                    {lastMessage}
                </p>
            </div>
            <span
                className={`
                    ${styles.date}
                    ${classes.ellipsisOnOverflowingText}
                `}
            >
                {date}
            </span>
        </button>
    );
}
