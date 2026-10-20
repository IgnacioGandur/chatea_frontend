import ConversationPreview from "./ConversationPreview";
import Skeleton from "./Skeleton";
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

type FetcherApiResponse = {
    conversations: GetUserConversations[];
    count: number;
} | null;

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
    const [hasLoaded, setHasLoaded] = useState(false);
    const [conversations, setConversations] = useState<GetUserConversations[]>(
        [],
    );

    // Get user conversations
    const fetcher = useFetcher<FetcherApiResponse>({
        key: "floating:conversations-list",
    });

    useEffect(() => {
        fetcher.load("api/conversations");
    }, []);

    useEffect(() => {
        if (fetcher && fetcher.data) {
            setConversations(fetcher.data.conversations);
            setHasLoaded(true);
        }
    }, [fetcher.data]);

    if (!user) return;

    if (!hasLoaded || fetcher.state === "loading") {
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
                ${floatingConversationsStyles.positionAbsoluteBottomRight}
                ${floatingConversationsStyles.roundedCorners}
            `}
        >
            <FloatingConversationHeader>{children}</FloatingConversationHeader>
            {conversations.length === 0 ? (
                <div
                    className={`
                        ${styles.emptyConversations}
                        ${classes.flexColumnCenter}
                    `}
                >
                    <span
                        className={`
                            material-symbols-rounded
                            ${styles.icon}
                            ${classes.textWithMainColorsGradient}
                        `}
                    >
                        voice_selection_off
                    </span>
                    <p
                        className={`
                            ${styles.para}
                            ${classes.textSecondarySmallItalicDimmedCentered}
                        `}
                    >
                        You don't have conversations yet...
                    </p>
                </div>
            ) : (
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
                            difference < 48
                                ? formatDistanceToNow(lastMessageDate, {
                                      addSuffix: true,
                                  })
                                : format(lastMessageDate, "dd/LLL/yyyy");

                        const messageSenderText =
                            c.messages[0].senderId === user.id
                                ? "You: "
                                : isGroup
                                  ? `${c.messages[0].sender.firstName} ${c.messages[0].sender.lastName}: `
                                  : null;

                        return (
                            <ConversationPreview
                                isGroup={isGroup}
                                lastMessageSenderText={messageSenderText}
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
            )}
        </div>
    );
}
