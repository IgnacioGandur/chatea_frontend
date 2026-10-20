import classes from "~/css/classes.module.css";
import type { ReactNode } from "react";

import floatingConversationsStyles from "../FloatingConversations.module.css";
import styles from "./FloatingConversationsList.module.css";

interface SkeletonProps {
    className?: string;
    children: ReactNode;
}

export default function Skeleton({ className, children }: SkeletonProps) {
    return (
        <div
            className={`
                ${className ?? ""}
                ${styles.skeleton}
                ${floatingConversationsStyles.conversationsList}
            `}
        >
            {children}
            <div
                className={`
                ${styles.conversations}
                ${classes.flexColumn}
                `}
            >
                {Array.from({ length: 7 }).map((_, i) => {
                    return (
                        <div
                            key={i}
                            className={styles.conversation}
                        >
                            <div
                                className={`
                                    ${styles.ppf}
                                    ${classes.suspenseBackgroundAnimation}
                                    ${classes.pictureMedium}
                                    ${classes.profilePictureRound}
                                `}
                            ></div>
                            <div
                                className={`
                                ${styles.name}
                                ${classes.suspenseBackgroundAnimation}
                                `}
                            ></div>
                            <div
                                className={`
                                ${styles.username}
                                ${classes.suspenseBackgroundAnimation}
                                `}
                            ></div>
                            <div
                                className={`
                                ${styles.date}
                                ${classes.suspenseBackgroundAnimation}
                                `}
                            ></div>
                        </div>
                    );
                })}
            </div>
            <p
                className={`
                    ${styles.para}
                    ${classes.textSecondarySmallItalicDimmedCentered}
                `}
            >
                Fetching conversations...
            </p>
        </div>
    );
}
