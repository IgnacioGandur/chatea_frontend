import styles from "./FloatingConversationsList.module.css";
import floatingConversationsStyles from "../FloatingConversations.module.css";
import classes from "~/css/classes.module.css";

import type { GetUserConversations } from "~/db/conversation.types";
import type { FloatingConversationState } from "../FloatingConversations";
import type { Dispatch, ReactNode, SetStateAction } from "react";

import FloatingConversationHeader from "../floating-conversation-header/FloatingConversationHeader";
import { useEffect, useState } from "react";

import { differenceInHours, formatDistanceToNow, format } from "date-fns";
import { useFetcher, useRouteLoaderData } from "react-router";
import type { RootLoaderData } from "~/types/RootLoaderData";

interface FloatingConversationsListProps {
    className?: string;
    setState: Dispatch<SetStateAction<FloatingConversationState>>;
    setConversationId: Dispatch<SetStateAction<number | null>>;
    children: ReactNode;
}

export default function FloatingConversationsList({
    className,
    setState,
    setConversationId,
    children,
}: FloatingConversationsListProps) {
    const { user } = useRouteLoaderData("root") as RootLoaderData;
    const [conversations, setConversations] = useState<GetUserConversations[]>(
        [],
    );

    // Get user conversations
    const fetcher = useFetcher<{
        conversations: GetUserConversations[];
        count: number;
    }>();

    useEffect(() => {
        fetcher.load("api/conversations");
    }, []);

    useEffect(() => {
        if (fetcher && fetcher.data) {
            setConversations(fetcher.data.conversations);
        }
    }, [fetcher.data]);

    if (!user) return;

    if (fetcher.state === "loading") {
        return (
            <Skeleton className={className}>
                <FloatingConversationHeader>
                    {children}
                </FloatingConversationHeader>
            </Skeleton>
        );
    }

    return (
        <div
            className={`
                ${className ?? ""}
                ${styles.conversationsList}
                ${classes.flexColumn}
                ${floatingConversationsStyles.conversationsList}
            `}
        >
            <FloatingConversationHeader>{children}</FloatingConversationHeader>
            <div
                className={`
                    ${styles.conversations}
                    ${classes.flexColumn}
                `}
            >
                {conversations.map((c) => {
                    const isGroup = c.isGroup;
                    const userB = c.participants.find(
                        (p) => p.userId !== user.id,
                    );

                    if (!isGroup && !userB) return <p>No data.</p>;

                    const ppf = isGroup
                        ? c.profilePicture
                        : userB!.user.profilePictureUrl;

                    const title = isGroup
                        ? c.title
                        : `${userB!.user.firstName} ${userB!.user.lastName}`;

                    const lastMessage = c.messages[0].content;

                    const lastMessageDate = c.lastMessageAt!;

                    const difference = Math.abs(
                        differenceInHours(lastMessageDate, new Date()),
                    );

                    const date =
                        difference > 48
                            ? formatDistanceToNow(lastMessageDate, {
                                  addSuffix: true,
                              })
                            : format(lastMessageDate, "dd/LLL/yyyy");

                    return (
                        <ConversationPreview
                            key={c.id}
                            setCurrentConversation={() => {
                                setState("conversationSelected");
                                setConversationId(c.id);
                            }}
                            date={date}
                            lastMessage={lastMessage}
                            name={title || ""}
                            profilePictureUrl={ppf || ""}
                        />
                    );
                })}
            </div>
        </div>
    );
}

interface ConversationPreviewProps {
    profilePictureUrl: string;
    name: string;
    lastMessage: string;
    date: string;
    setCurrentConversation: () => void;
}

function ConversationPreview({
    profilePictureUrl,
    name,
    lastMessage,
    date,
    setCurrentConversation,
}: ConversationPreviewProps) {
    return (
        <button
            onClick={() => setCurrentConversation()}
            className={styles.conversationPreview}
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
            <h2 className={styles.name}>{name}</h2>
            <p
                className={`
                    ${styles.lastMessage}
                    ${classes.ellipsisOnOverflowingText}
                `}
            >
                {lastMessage}
            </p>
            <span className={styles.date}>{date}</span>
        </button>
    );
}

interface SkeletonProps {
    className?: string;
    children: ReactNode;
}

function Skeleton({ className, children }: SkeletonProps) {
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
