import styles from "./ConversationMessages.module.css";
import currentConversationStyles from "../CurrentConversation.module.css";
import {
    useFetcher,
    useParams,
    useRevalidator,
    useRouteLoaderData,
} from "react-router";
import { v4 as uuid } from "uuid";
import type { Prisma } from "../../../../../../generated/prisma/client";
import { useEffect, useRef, useState } from "react";
import classes from "~/css/classes.module.css";
import type { RootLoaderData } from "~/types/RootLoaderData";
import { differenceInHours, format } from "date-fns";
import type { MaterialSymbols } from "material-design-icons-literal-types";
import Popover from "~/components/popover/Popover";
import toast from "react-hot-toast";
import getErrorMessage from "~/utils/getErrorMessage";
import ImageAttachmentViewer from "./image-attachment-viewer/ImageAttachmentViewer";

type ParticipantWithUser = Prisma.ParticipantGetPayload<{
    include: {
        user: {
            omit: {
                password: true;
            };
        };
    };
}>;

interface ConversationMessagesProps {
    initialData: {
        messages: MessageWithAttachmentAndSender[];
        hasMoreMessages: boolean;
        nextCursor: number | null;
    };
    conversationParticipants: ParticipantWithUser[];
    conversationIsGroup: boolean;
}

type MessageWithAttachmentAndSender = Prisma.MessageGetPayload<{
    include: {
        attachments: true;
        sender: true;
    };
}>;

interface SendMessageFetcherResponse {
    success: boolean;
    message: string;
    createdMessage: MessageWithAttachmentAndSender;
    temporaryId: string;
}

interface LoadMoreMessageFetcherResponse {
    messages: MessageWithAttachmentAndSender[];
    hasMoreMessages: boolean;
    nextCursor: number | null;
}

type OptimisticMessage = Omit<MessageWithAttachmentAndSender, "id"> & {
    id: string | number;
    temporaryId: string;
};

interface SendMessageFormProps {
    onOptimisticMessage: (optimisticMessage: OptimisticMessage) => void;
    onMessageConfirmed: (
        confirmedMessage: MessageWithAttachmentAndSender,
        optimisticTemporaryId: string,
    ) => void;
    onMessageFailed: (temporaryId: string) => void;
}

interface DeleteMessageFetcherResponse {
    success: boolean;
    message: string;
    messageId: number | string;
}

function SendMessageForm({
    onOptimisticMessage,
    onMessageConfirmed,
    onMessageFailed,
}: SendMessageFormProps) {
    const { id } = useParams();
    const { user } = useRouteLoaderData("root") as RootLoaderData;
    const revalidator = useRevalidator();

    const sendMessageFetcher = useFetcher<SendMessageFetcherResponse>({
        key: "send-message",
    });

    async function sendMessage(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = e.currentTarget;
        const formFields = new FormData(form);
        const temporaryId = uuid();

        formFields.set("temporaryId", temporaryId);

        // Create the optimistic message
        const formValues = Object.fromEntries(formFields) as {
            file: File;
            intent: "send-message";
            message: string;
        };

        const { message: content, file } = formValues;

        if (!content && file.size === 0) {
            return;
        }

        const optimisticMessage: OptimisticMessage = {
            id: `optimistic-${temporaryId}`,
            temporaryId,
            content,
            conversationId: Number(id),
            createdAt: new Date(),
            updatedAt: new Date(),
            deleted: false,
            isRead: false,
            senderId: user!.id,
            attachments:
                file && file.size > 0
                    ? [
                          {
                              id: 0,
                              messageId: 0,
                              fileName: file.name,
                              fileType: file.type,
                              fileUrl: URL.createObjectURL(file),
                              uploadedAt: new Date(),
                          },
                      ]
                    : [],
            sender: {
                firstName: user!.firstName,
                lastName: user!.lastName,
                id: user!.id,
                username: user!.username,
                joinedOn: user!.joinedOn,
                lastActive: user!.lastActive,
                password: "",
                profilePictureUrl: user!.profilePictureUrl,
            },
        };

        onOptimisticMessage(optimisticMessage);

        form.reset();

        try {
            const response = await fetch(`/api/conversations/${id}/messages`, {
                method: "post",
                body: formFields,
            });

            if (!response) throw new Error("HTTP error");

            const data: SendMessageFetcherResponse = await response.json();

            const { success, createdMessage, temporaryId } = data;

            if (success) {
                onMessageConfirmed(createdMessage, temporaryId);

                //PERF: Since this is a small scale project, it's okay to
                //revalidate the loader function for the
                //'currentConversation' component every time a new message is sent to
                //keep the sidebar's latest message in sync.

                revalidator.revalidate();

                const event = new CustomEvent("chat:send-message", {
                    detail: null,
                });

                window.dispatchEvent(event);
                return;
            } else {
                const event = new CustomEvent("chat:send-message", {
                    detail: data,
                });

                window.dispatchEvent(event);
                return;
            }
        } catch (e: unknown) {
            toast.error(getErrorMessage(e));
            onMessageFailed(temporaryId);
        }
    }

    useEffect(() => {
        if (sendMessageFetcher.data) {
            const { success } = sendMessageFetcher.data;
            if (success) {
                const { createdMessage } = sendMessageFetcher.data;
                const { temporaryId } = sendMessageFetcher.data;

                onMessageConfirmed(createdMessage, temporaryId);
            } else {
                const { message: errorMessage } = sendMessageFetcher.data;
                toast.error(errorMessage, { id: "send-message-error" });

                return () => toast.dismiss("send-message-error");
            }
        }
    }, [sendMessageFetcher.data]);

    return (
        <form
            onSubmit={sendMessage}
            className={`
                ${styles.sendMessage}
                ${classes.flexRowJustifySpaceBetween}
                ${currentConversationStyles.sendMessageForm}
            `}
            method="post"
            encType="multipart/form-data"
        >
            <input
                type="hidden"
                name="intent"
                value="send-message"
            />
            <input
                type="file"
                name="file"
            />
            <input
                className={styles.input}
                type="text"
                name="message"
                required
            />
            <button type="submit">Send</button>
        </form>
    );
}

export default function ConversationMessages(props: ConversationMessagesProps) {
    const { id } = useParams();
    const { user } = useRouteLoaderData("root") as RootLoaderData;
    const deleteMessageFetcher = useFetcher<DeleteMessageFetcherResponse>();

    const loadMoreMessagesFetcher =
        useFetcher<LoadMoreMessageFetcherResponse>();

    const { conversationParticipants } = props;

    const loggedUserRoleInConversation = conversationParticipants.find(
        (p) => p.userId === user!.id,
    )!.role;

    const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(
        props.initialData.hasMoreMessages,
    );
    const [nextCursor, setNextCursor] = useState<number | null>(
        props.initialData.nextCursor,
    );
    const [messages, setMessages] = useState<MessageWithAttachmentAndSender[]>(
        props.initialData.messages,
    );
    const [optimisticMessages, setOptimisticMessages] = useState<
        OptimisticMessage[]
    >([]);

    // Scroll the messages container to the bottom when the user sends a new message and when the conversation loads.
    const scrollToBottomAnchor = useRef<HTMLDivElement | null>(null);

    function scrollAnchorToBottom() {
        if (scrollToBottomAnchor && scrollToBottomAnchor.current) {
            scrollToBottomAnchor.current.scrollIntoView({ behavior: "smooth" });
        }
    }

    useEffect(() => {
        scrollAnchorToBottom();
    }, [id]);
    // =====================================

    // Implement optimistic messages.
    function onOptimisticMessage(optimisticMessage: OptimisticMessage) {
        setOptimisticMessages((prev) => [...prev, optimisticMessage]);
        scrollAnchorToBottom();
    }

    // When the message is successfully created, append it to the array of messages.
    function onMessageConfirmed(
        confirmedMessage: MessageWithAttachmentAndSender,
        optimisticTemporaryId: string,
    ) {
        setMessages((prev) => {
            const array = [confirmedMessage, ...prev];
            const map = new Map<number, MessageWithAttachmentAndSender>();
            array.forEach((m) => {
                map.set(m.id, m);
            });
            return [...map.values()];
        });

        setOptimisticMessages((prev) => {
            const updated = prev.filter(
                (m) => m.temporaryId !== optimisticTemporaryId,
            );

            return updated;
        });
    }

    // If the message fails, remove it from the array.
    function onMessageFailed(temporaryId: string) {
        setOptimisticMessages((prev) =>
            prev.filter((m) => m.temporaryId !== temporaryId),
        );
    }
    // =====================================

    // Handle the loading of older messages.
    function loadMoreMessage() {
        const url = `/api/conversations/${id}/messages?cursor=${nextCursor}`;
        loadMoreMessagesFetcher.load(url);
    }

    useEffect(() => {
        if (loadMoreMessagesFetcher.data) {
            const moreMessages = loadMoreMessagesFetcher.data.messages;
            const nextCursor = loadMoreMessagesFetcher.data.nextCursor;
            const hasMoreMessages =
                loadMoreMessagesFetcher.data.hasMoreMessages;

            setNextCursor(nextCursor);
            setHasMoreMessages(hasMoreMessages);

            setMessages((prev) => {
                const array = [...prev, ...[...moreMessages].reverse()];
                const map = new Map<number, MessageWithAttachmentAndSender>();
                array.forEach((m) => map.set(m.id, m));
                return [...map.values()];
            });
        }
    }, [loadMoreMessagesFetcher.data]);

    // =====================================

    // Handle message deletion.
    function handleMessageDelete(messageId: string | number) {
        setMessages((prev) =>
            prev.map((m) =>
                Number(messageId) === m.id ? { ...m, deleted: true } : m,
            ),
        );
    }

    // Rollback if the deletion failed...
    useEffect(() => {
        if (deleteMessageFetcher && deleteMessageFetcher.data) {
            const { success } = deleteMessageFetcher.data;

            if (!success) {
                const { messageId } = deleteMessageFetcher.data;
                const { message: errorMessage } = deleteMessageFetcher.data;

                setMessages((prev) =>
                    prev.map((m) =>
                        Number(messageId) === m.id
                            ? { ...m, deleted: false }
                            : m,
                    ),
                );

                toast.error(errorMessage, {
                    id: "message-deletion-failed",
                });

                return () => toast.dismiss("message-deletion-failed");
            }
        }
    }, [deleteMessageFetcher.data]);
    // =====================================

    const displayedMessages: (
        MessageWithAttachmentAndSender | OptimisticMessage
    )[] = [...[...messages].reverse(), ...optimisticMessages];

    return (
        <>
            {displayedMessages.length === 0 ? (
                <div
                    className={`
                        ${styles.emptyMessages}
                        ${currentConversationStyles.noMessages}
                        ${classes.flexColumnCenter}
                    `}
                >
                    <h1>This conversation doesn't have messages.</h1>
                </div>
            ) : (
                <ul
                    className={`
                        ${styles.messages}
                        ${classes.flexColumn}
                        ${currentConversationStyles.messages}
                    `}
                >
                    {hasMoreMessages ? (
                        <button onClick={loadMoreMessage}>Load more</button>
                    ) : null}
                    {displayedMessages.map((m, i) => {
                        const dayDate = format(
                            m.createdAt,
                            "MMMM dd, yyyy — EEEE",
                        );

                        const previousMessage =
                            i > 0 ? displayedMessages[i - 1] : null;

                        const nextMessage =
                            i < displayedMessages.length - 1
                                ? displayedMessages[i + 1]
                                : null;

                        // Attachment values
                        const hasAttachments = m.attachments?.length > 0;
                        const attachmentUrl = hasAttachments
                            ? m.attachments[0].fileUrl
                            : "";
                        const attachmentFilename = hasAttachments
                            ? m.attachments[0].fileName
                            : "";
                        const attachmentFiletype = hasAttachments
                            ? m.attachments[0].fileType
                            : "";
                        const attachmentIsImage =
                            hasAttachments &&
                            m.attachments[0].fileType.includes("image");

                        // Sender values
                        const senderProfilePicture = m.sender.profilePictureUrl;
                        const loggedUserIsSender = m.senderId === user?.id;
                        const senderName = loggedUserIsSender
                            ? "You"
                            : `${m.sender.firstName} ${m.sender.lastName}`;

                        const nonImageFileIcon: MaterialSymbols = "attachment";

                        const messageSenderRoleInConversation =
                            conversationParticipants.find(
                                (p) => p.userId === m.senderId,
                            )!.role;

                        // NOTE: Delete button display conditions:
                        // 1. The logged user is the message owner.
                        // 2. The conversation is a group conversation and
                        // the logged user is the group owner.
                        // 3. The conversation is a group conversation, the
                        // logged user is an administrator in the group and
                        // the message was sent by an user with a role of
                        // 'USER'.

                        const showDeleteButton = m.deleted
                            ? null
                            : loggedUserIsSender ||
                              loggedUserRoleInConversation === "OWNER" ||
                              (loggedUserRoleInConversation === "ADMIN" &&
                                  messageSenderRoleInConversation === "USER");

                        // NOTE: Date display conditions:
                        // 1. Display the day the message was sent in the
                        // format: "January 01, 2001 - Monday".
                        // 2. Show the date only when there's a >= 24
                        // hours gap between the current message and the
                        // previous message.
                        // 3. Show the hour of the message in the format:
                        // '23:59' at the bottom of the message bubble on
                        // every message.

                        const hoursSincePreviousMessages = previousMessage
                            ? Math.abs(
                                  differenceInHours(
                                      m.createdAt,
                                      previousMessage.createdAt,
                                  ),
                              )
                            : 0;

                        const showDayDate =
                            !previousMessage ||
                            hoursSincePreviousMessages >= 24;

                        // NOTE: Sender display conditions:
                        // 1. Display the message sender in the current
                        // message only when the next message is not from
                        // the same user

                        const nextMessageIsFromSameuser =
                            m.senderId === nextMessage?.senderId;

                        const showSender = !nextMessageIsFromSameuser;

                        // NOTE: Attachments display conditions:
                        // 1. If the attachment filetype contains
                        // 'image/', display an 'img' tag, otherwise
                        // display an icon with the filename, when the user
                        // clicks the file icon the file should be
                        // downloaded.

                        return (
                            <li
                                key={m.id}
                                className={`
                                    ${styles.message}
                                    ${m.deleted ? styles.deleted : ""}
                                    ${!nextMessageIsFromSameuser ? styles.bottomMargin : ""}
                                    ${loggedUserIsSender ? styles.loggedUserMessage : styles.userBMessage}
                                    ${classes.flexColumn}
                                `}
                            >
                                {showDayDate ? (
                                    <time className={styles.dayDate}>
                                        {dayDate}
                                    </time>
                                ) : null}
                                <div
                                    className={`
                                        ${styles.wrapper}
                                        ${classes.flexRow}
                                    `}
                                >
                                    {showDeleteButton ? (
                                        <Popover
                                            anchorName={`--delete-message-${m.id}`}
                                            popoverTarget={`delete-message-${m.id}`}
                                            buttonContent={
                                                <span className="material-symbols-rounded">
                                                    close
                                                </span>
                                            }
                                            altPopoverClass={`
                                                ${styles.deleteMessageForm}
                                            `}
                                            anchorButtonClass={
                                                styles.showDeleteMessageFormButton
                                            }
                                            anchorButtonAriaLabel="Delete this message"
                                        >
                                            <deleteMessageFetcher.Form
                                                method="post"
                                                onSubmit={() =>
                                                    handleMessageDelete(m.id)
                                                }
                                                className={`
                                                    ${classes.flexColumn}
                                                    ${styles.deleteMessageForm}
                                                `}
                                            >
                                                {loggedUserIsSender ? (
                                                    <input
                                                        type="hidden"
                                                        name="intent"
                                                        value="delete-own-message"
                                                    />
                                                ) : (
                                                    <>
                                                        <input
                                                            type="hidden"
                                                            name="intent"
                                                            value="delete-group-message"
                                                        />
                                                        <input
                                                            type="hidden"
                                                            name="senderId"
                                                            value={m.senderId}
                                                        />
                                                    </>
                                                )}
                                                <input
                                                    type="hidden"
                                                    name="messageId"
                                                    value={m.id}
                                                />
                                                <h4>Delete this message?</h4>
                                                <div
                                                    className={
                                                        classes.separator
                                                    }
                                                ></div>
                                                <button
                                                    type="submit"
                                                    className={classes.button1}
                                                >
                                                    Confirm
                                                </button>
                                            </deleteMessageFetcher.Form>
                                        </Popover>
                                    ) : null}
                                    <div
                                        className={`
                                            ${classes.flexColumn}
                                            ${styles.contentWrapper}
                                        `}
                                    >
                                        {hasAttachments ? (
                                            attachmentIsImage ? (
                                                <>
                                                    <ImageAttachmentViewer
                                                        imageClassName={
                                                            styles.imageAttachment
                                                        }
                                                        src={attachmentUrl}
                                                        alt={attachmentFilename}
                                                    />
                                                </>
                                            ) : (
                                                <div
                                                    className={`
                                                        ${styles.fileAttachment}
                                                        ${classes.flexColumn}
                                                    `}
                                                >
                                                    <h4
                                                        className={
                                                            styles.attachmentTitle
                                                        }
                                                    >
                                                        Attachment
                                                    </h4>
                                                    <div
                                                        className={`
                                                            ${styles.iconAndName}
                                                            ${classes.flexRowStartCenter}
                                                        `}
                                                    >
                                                        <span
                                                            className={`
                                                                ${styles.icon}
                                                                material-symbols-rounded
                                                            `}
                                                        >
                                                            {nonImageFileIcon}
                                                        </span>
                                                        <div
                                                            className={
                                                                styles.dotSeparator
                                                            }
                                                        ></div>
                                                        <p
                                                            className={
                                                                styles.filename
                                                            }
                                                        >
                                                            {attachmentFilename}
                                                        </p>
                                                    </div>
                                                    <div
                                                        className={`
                                                            ${styles.extensionAndDownload}
                                                            ${classes.flexRowJustifySpaceBetween}
                                                        `}
                                                    >
                                                        <span
                                                            className={`
                                                                ${styles.fileExtension}
                                                            `}
                                                        >
                                                            {attachmentFiletype}
                                                        </span>
                                                        <span
                                                            className={`
                                                                ${styles.downloadText}
                                                            `}
                                                        >
                                                            Download
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        ) : null}
                                        <p className={styles.textContent}>
                                            {m.deleted
                                                ? "Message deleted."
                                                : m.content}
                                        </p>
                                        <span className={styles.hourDate}>
                                            {format(m.createdAt, "HH:mm")}
                                        </span>
                                    </div>
                                    <div className={styles.padding}></div>
                                </div>
                                {showSender ? (
                                    <div
                                        className={`
                                        ${styles.sender}
                                        ${classes.flexRowStartCenter}
                                    `}
                                    >
                                        <img
                                            className={`
                                            ${styles.profilePicture}
                                            ${classes.profilePictureRound}
                                            ${classes.correctImage}
                                        `}
                                            src={senderProfilePicture}
                                            alt={senderName}
                                        />
                                        <h4 className={styles.name}>
                                            {senderName}
                                        </h4>
                                    </div>
                                ) : null}
                            </li>
                        );
                    })}
                    <div
                        ref={scrollToBottomAnchor}
                        className={styles.scrollToBottomAnchor}
                    ></div>
                </ul>
            )}
            <SendMessageForm
                onMessageFailed={onMessageFailed}
                onMessageConfirmed={onMessageConfirmed}
                onOptimisticMessage={onOptimisticMessage}
            />
        </>
    );
}
