import type React from "react";
import styles from "./Popover.module.css";

interface PopoverProps {
    children: React.ReactNode;
    anchorName: string;
    buttonContent: React.ReactNode | string;
    popoverTarget: string;
    altPopoverClass?: string;
}

export default function Popover({
    anchorName,
    popoverTarget,
    buttonContent,
    altPopoverClass,
    children,
}: PopoverProps) {
    return (
        <div className={styles.popoverContainer}>
            <button
                popoverTarget={popoverTarget}
                className={styles.anchor}
                style={{
                    anchorName,
                }}
            >
                {buttonContent}
            </button>
            <div
                className={`${styles.popover} ${altPopoverClass}`}
                popover="auto"
                id={popoverTarget}
                style={{
                    positionAnchor: anchorName,
                }}
            >
                {children}
            </div>
        </div>
    );
}
