import classes from "~/css/classes.module.css";
import styles from "./FloatingConversations.module.css";
import { useState } from "react";
import { NavLink } from "react-router";

import FloatingCurrentConversation from "./floating-current-conversation/FloatingCurrentConversation";

import FloatingConversationsList from "./floating-conversations-list/FloatingConversationsList";
import FloatingClosedConversations from "./floating-closed-conversations/FloatingClosedConversations";

export type FloatingConversationState =
    "closed" | "conversationsList" | "conversationSelected";

export default function FloatingConversations() {
    const [state, setState] = useState<FloatingConversationState>("closed");

    function handleState(state: FloatingConversationState) {
        setState(state);
    }

    const [conversationId, setConversationId] = useState<number | null>(null);

    // Mini Buttons

    const goToConversationsButton = (
        <NavLink
            to="/conversations"
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
            onClick={() => handleState("closed")}
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
            onClick={() => handleState("conversationsList")}
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
