import { useFetcher, useRouteLoaderData } from "react-router";
import type {
    Participant,
    Prisma,
} from "../../../../../../generated/prisma/client";
import styles from "./SingleMessage.module.css";
import type { RootLoaderData } from "~/types/RootLoaderData";
import classes from "~/css/classes.module.css";
import AltPopover from "~/components/alt-popover/AltPopover";
import PillButton from "~/components/pill-button/PillButton";
import { differenceInMinutes, formatDistanceToNow } from "date-fns";
import { formatMessageDate } from "~/utils/formatDate";

type Message = Prisma.MessageGetPayload<{
    include: {
        attachments: true;
        sender: true;
    };
}>;

interface SingleMessageProps {
    conversationIsGroup: boolean;
    participants: Participant[];
    nextMessage?: Message;
    previousMessage?: Message;
    message: Message;
}

export default function SingleMessage({
    conversationIsGroup,
    participants,
    previousMessage,
    nextMessage,
    message,
}: SingleMessageProps) {
    const fetcher = useFetcher({ key: "current-conversation" });
    const { user: rootData } = useRouteLoaderData("root") as RootLoaderData;

    const loggedUserAsParticipant = participants.find(
        (p) => p.userId === rootData!.id,
    );
    const messageSenderAsParticipant = participants.find(
        (p) => p.userId === message.senderId,
    );

    const isYourMessage = message.senderId === rootData!.id;
    const isDeleted = message.deleted;

    const loggedUserCanDeleteMessage =
        isYourMessage ||
        (conversationIsGroup && loggedUserAsParticipant!.role === "OWNER") ||
        (loggedUserAsParticipant!.role === "ADMIN" &&
            messageSenderAsParticipant!.role === "USER");

    const attachment = message.attachments[0];
    const name = `${message.sender.firstName} ${message.sender.lastName}`;

    const nextMessageIsFromSameUser =
        message.senderId === nextMessage?.senderId;

    const showDate =
        !nextMessage ||
        (nextMessage &&
            differenceInMinutes(message.createdAt, nextMessage.createdAt) > 5);

    // TODO: Add a linear background that spreads along the chain of messages that are from the same user.

    return (
        <li
            className={`${styles.message} ${isYourMessage ? styles.you : null} ${nextMessageIsFromSameUser ? styles.nextMessage : ""} ${isDeleted ? styles.deletedMessage : ""}`}
        >
            {showDate ? (
                <time className={styles.date}>
                    {formatMessageDate(message.createdAt)}
                </time>
            ) : null}
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
            <div className={styles.contentWrapper}>
                {loggedUserCanDeleteMessage && !isDeleted ? (
                    <AltPopover
                        className={styles.deletePopover}
                        icon="delete"
                        buttonClassName={`${styles.deleteMessageButton} ${classes.roundDefaultButton}`}
                        popoverContentClass={styles.popoverContent}
                        popoverPosition={isYourMessage ? "left" : "right"}
                    >
                        <fetcher.Form
                            className={`${classes.floatingForm} ${classes.flexColumnStartCenter}`}
                            method="post"
                        >
                            {isYourMessage ? (
                                <input
                                    type="hidden"
                                    name="intent"
                                    value="delete-own-message"
                                />
                            ) : (
                                <>
                                    <input
                                        type="hidden"
                                        name="senderId"
                                        value={message.senderId}
                                    />
                                    <input
                                        type="hidden"
                                        name="intent"
                                        value="delete-group-message"
                                    />
                                </>
                            )}
                            <h3
                                className={`${classes.noWrap} ${classes.titleSmallMainFont}`}
                            >
                                Delete this message?
                            </h3>
                            <PillButton
                                buttonAriaLabel="Confirm deletion of this message"
                                buttonText="Confirm"
                                buttonTitle="Confirm deletion"
                                includeEmptySpace={false}
                                includeIcon={false}
                                type="submit"
                                name="messageId"
                                value={message.id}
                            />
                        </fetcher.Form>
                    </AltPopover>
                ) : (
                    <div
                        className={`${styles.deleteMessageButtonPlaceholder}`}
                    ></div>
                )}
                <p className={styles.content}>
                    <span>{message.content}</span>
                    <time
                        className={`${classes.textSmallSecondary} ${styles.ago} ${classes.noWrap}`}
                    >
                        {formatDistanceToNow(message.createdAt, {
                            includeSeconds: true,
                        })}
                    </time>
                </p>
                {attachment && !isDeleted ? (
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
            </div>
        </li>
    );
}
