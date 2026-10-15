import classes from "~/css/classes.module.css";
import styles from "./FloatingConversationHeader.module.css";
import type { ReactNode } from "react";

interface FloatingConversationHeaderProps {
    children: ReactNode;
}

export default function FloatingConversationHeader({
    children,
}: FloatingConversationHeaderProps) {
    return (
        <div
            className={`
                    ${styles.header}
                    ${classes.flexRowJustifySpaceBetween}
                `}
        >
            <div
                className={`
                ${styles.wrapper}
                ${classes.flexRowStartCenter}
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
            </div>
            <div
                className={`
                        ${styles.buttons}
                        ${classes.flexRowCenter}
                    `}
            >
                {children}
            </div>
        </div>
    );
}
