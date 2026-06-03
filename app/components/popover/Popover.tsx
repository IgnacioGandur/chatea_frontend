import type React from "react";
import styles from "./Popover.module.css";

interface PopoverProps {
    anchorName: string;
    popoverTarget: string;
    buttonContent: React.ReactNode | string;
    altPopoverClass?: string;
    anchorButtonClass?: string;
    popoverContainerClass?: string;
    anchorButtonTitle?: string;
    anchorButtonAriaLabel: string;
    children: React.ReactNode;
}

export default function Popover({
    anchorName,
    popoverTarget,
    buttonContent,
    altPopoverClass,
    anchorButtonClass,
    popoverContainerClass,
    anchorButtonTitle,
    anchorButtonAriaLabel,
    children,
}: PopoverProps) {
    return (
        <div className={`${styles.popoverContainer} ${popoverContainerClass}`}>
            <button
                aria-label={anchorButtonAriaLabel}
                title={anchorButtonTitle}
                popoverTarget={popoverTarget}
                className={`${styles.anchor} ${anchorButtonClass}`}
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
