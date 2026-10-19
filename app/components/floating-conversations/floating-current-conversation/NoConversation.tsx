import type { ReactNode } from "react";
import floatingConversationStyles from "../FloatingConversations.module.css";
import FloatingConversationHeader from "../floating-conversation-header/FloatingConversationHeader";
import classes from "~/css/classes.module.css";
import styles from "./FloatingCurrentConversation.module.css";

interface NoConversationProps {
    children: ReactNode;
}

export default function NoConversation({ children }: NoConversationProps) {
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
                    ${classes.flexColumnCenter}
                `}
            >
                <span
                    className={`
                        material-symbols-rounded
                        ${classes.textWithMainColorsGradient}
                        ${styles.icon}
                    `}
                >
                    globe_2_cancel
                </span>
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
