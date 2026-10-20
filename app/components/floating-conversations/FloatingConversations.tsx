import classes from "~/css/classes.module.css";
import styles from "./FloatingConversations.module.css";
import { useState, useEffect } from "react";
import { NavLink, useRouteLoaderData, useLocation } from "react-router";

import FloatingCurrentConversation from "./floating-current-conversation/FloatingCurrentConversation";

import FloatingConversationsList from "./floating-conversations-list/FloatingConversationsList";
import FloatingClosedConversations from "./floating-closed-conversations/FloatingClosedConversations";
import type { RootLoaderData } from "~/types/RootLoaderData";

export type FloatingConversationState =
    "closed" | "conversationsList" | "conversationSelected";

export default function FloatingConversations() {
    const location = useLocation();
    const currentPath = location.pathname;

    const { user } = useRouteLoaderData("root") as RootLoaderData;

    const [state, setState] = useState<FloatingConversationState>("closed");

    function handleState(state: FloatingConversationState) {
        setState(state);
    }

    const [conversationId, setConversationId] = useState<number | null>(null);

    // When the user logs in/out, close the floating conversation.
    useEffect(() => {
        setState("closed");
    }, [user]);
    // ===========================================================

    if (currentPath.includes("/conversations")) return;

    // Mini Buttons
    const goToConversationsButton = (
        <NavLink
            to={
                conversationId
                    ? `/conversations/${conversationId}`
                    : "/conversations"
            }
            title="Go to conversations"
            className={`
                ${styles.miniButton}
                ${classes.gridCenter}
                ${classes.outline1}
            `}
        >
            <span
                className={`
                    material-symbols-rounded
                    ${styles.icon}
                `}
            >
                expand_content
            </span>
        </NavLink>
    );

    const closeFloatingConversationsButton = (
        <button
            title="Close conversations list"
            onClick={() => {
                handleState("closed");
                setConversationId(null);
            }}
            className={`
                ${styles.miniButton}
                ${classes.gridCenter}
                ${classes.miniButton}
                ${classes.outline1}
            `}
        >
            <span
                className={`
                    material-symbols-rounded
                    ${styles.icon}
                `}
            >
                keyboard_arrow_down
            </span>
        </button>
    );

    const conversationsListButton = (
        <button
            title="Open conversations list"
            onClick={() => {
                handleState("conversationsList");
                setConversationId(null);
            }}
            className={`
                ${styles.miniButton}
                ${classes.gridCenter}
                ${classes.miniButton}
                ${classes.outline1}
            `}
        >
            <span
                className={`
                    material-symbols-rounded
                    ${styles.icon}
                `}
            >
                chevron_backward
            </span>
        </button>
    );

    // ============

    // Don't render the component if a user is not logged.
    if (!user) return;
    // ==================================================

    return state === "closed" ? (
        <FloatingClosedConversations
            className={styles.positionAbsoluteBottomRight}
            onClick={() => handleState("conversationsList")}
        />
    ) : state === "conversationsList" ? (
        <FloatingConversationsList
            className={`
                ${styles.positionAbsoluteBottomRight}
                ${styles.roundedCorners}
                `}
            setState={setState}
            setConversationId={setConversationId}
        >
            {goToConversationsButton}
            {closeFloatingConversationsButton}
        </FloatingConversationsList>
    ) : state === "conversationSelected" ? (
        <FloatingCurrentConversation
            className={`
                ${styles.positionAbsoluteBottomRight}
                ${styles.roundedCorners}
            `}
            conversationId={conversationId}
        >
            {conversationsListButton}
            {goToConversationsButton}
            {closeFloatingConversationsButton}
        </FloatingCurrentConversation>
    ) : null;
}
