import { useRouteLoaderData } from "react-router";
import type { Prisma } from "../../../../../../generated/prisma/client";
import styles from "./SingleMessage.module.css";
import { formatDistanceToNow } from "date-fns";
import type { RootLoaderData } from "~/types/RootLoaderData";
import classes from "~/css/classes.module.css";

interface SingleMessageProps {
    nextMessageIsFromSameUser: boolean;
    message: Prisma.MessageGetPayload<{
        include: {
            attachments: true;
            sender: true;
        };
    }>;
}

export default function SingleMessage({
    nextMessageIsFromSameUser,
    message,
}: SingleMessageProps) {
    const { user: rootData } = useRouteLoaderData("root") as RootLoaderData;

    const isYourMessage = message.senderId === rootData!.id;
    const attachment = message.attachments[0];
    const name = `${message.sender.firstName} ${message.sender.lastName}`;

    // TODO: Add a linear background that spreads along the chain of messages that are from the same user.
    // TODO: Write a special grid layout for chained messages.
    return (
        <li
            key={message.id}
            className={`${styles.message} ${isYourMessage ? styles.you : null} ${nextMessageIsFromSameUser ? styles.nextMessage : ""}`}
        >
            <span className={styles.date}>
                {formatDistanceToNow(message.createdAt, { addSuffix: true })}
            </span>
            <div className={`${styles.header} ${classes.flexRowStartCenter}`}>
                <img
                    className={`${classes.profilePictureRound} ${classes.pictureSmall} ${styles.ppf}`}
                    src={message.sender.profilePictureUrl}
                    alt=""
                />
                <h3 className={`${styles.name}`}>
                    {isYourMessage ? "You" : name}
                </h3>
            </div>
            <p className={styles.content}>{message.content}</p>
            {attachment ? (
                <div className={styles.attachment}>
                    {attachment.fileType.startsWith("image/") ? (
                        <img
                            className={styles.image}
                            src={attachment.fileUrl}
                            alt={attachment.fileName}
                        />
                    ) : (
                        <div className="file">
                            <p>{attachment.fileName}</p>
                        </div>
                    )}
                </div>
            ) : null}
        </li>
    );
}
