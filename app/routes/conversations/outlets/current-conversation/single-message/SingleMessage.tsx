import { useRouteLoaderData } from "react-router";
import type { Message } from "../../../../../../generated/prisma/client";
import styles from "./SingleMessage.module.css";
import { formatDistanceToNow } from "date-fns";
import type { RootLoaderData } from "~/types/RootLoaderData";

interface SingleMessageProps {
    message: Message;
}

export default function SingleMessage({ message }: SingleMessageProps) {
    const { user: rootData } = useRouteLoaderData("root") as RootLoaderData;

    const isYourMessage = message.senderId === rootData!.id;

    return (
        <li
            className={`${styles.message} ${isYourMessage ? styles.you : null}`}
        >
            <p className={styles.content}>{message.content}</p>
            <span className={styles.date}>
                {formatDistanceToNow(message.createdAt, { addSuffix: true })}
            </span>
        </li>
    );
}
