import classes from "~/css/classes.module.css";
import styles from "./FloatingClosedConversations.module.css";

interface FloatingClosedConversationsProps {
    className?: string;
    onClick: () => void;
}

export default function FloatingClosedConversations({
    className,
    onClick,
}: FloatingClosedConversationsProps) {
    return (
        <button
            title="Open your conversations"
            onClick={onClick}
            className={`
                ${className ?? ""}
                ${styles.floatingConversationClosed}
                ${classes.flexRowStartCenter}
                ${classes.outline1}
            `}
        >
            <span
                className={`
                    material-symbols-rounded
                    ${styles.icon}
                `}
            >
                conversation
            </span>
            <div
                className={`
                ${styles.separator}
                ${classes.ballSeparator}
                `}
            ></div>
            <p className={styles.text}>Conversations</p>
        </button>
    );
}
