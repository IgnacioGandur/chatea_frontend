import type { ReactNode } from "react";
import styles from "../floating-current-conversation/FloatingCurrentConversation.module.css";
import classes from "~/css/classes.module.css";

interface Skeleton {
    className?: string;
    children: ReactNode;
}

export default function Skeleton({ className, children }: Skeleton) {
    return (
        <div
            className={`
                ${styles.skeleton}
                ${classes.flexColumn}
                ${className ?? ""}
            `}
        >
            <div
                className={`
                    ${styles.header}
                    ${classes.flexRowJustifySpaceBetween}
                `}
            >
                <div
                    className={`
                        ${styles.userB}
                        ${classes.flexRowStartCenter}
                    `}
                >
                    <div
                        className={`
                                ${styles.ppf}
                                ${classes.pictureMedium}
                                ${classes.correctImage}
                                ${classes.suspenseBackgroundAnimation}
                                ${classes.profilePictureRound}
                            `}
                    ></div>
                    <div
                        className={`
                            ${styles.name}
                            ${classes.suspenseBackgroundAnimation}
                        `}
                    ></div>
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
            <div
                className={`
                    ${styles.messages}
                    ${classes.flexColumn}
                `}
            >
                {Array.from({ length: 11 }).map((_, i) => {
                    return (
                        <div
                            key={i}
                            className={`
                                ${styles.message}
                                ${classes.suspenseBackgroundAnimation}
                            `}
                        ></div>
                    );
                })}
            </div>
            <p
                className={`
                        ${styles.para}
                        ${classes.textSecondarySmallItalicDimmedCentered}
                    `}
            >
                Fetching conversation...
            </p>
        </div>
    );
}
