import type { MaterialSymbols } from "material-design-icons-literal-types";
import styles from "./AltPopover.module.css";
import { useRef, useState } from "react";
import { useClickOutside } from "~/hooks/useClickOutside";

interface AltPopoverProps {
    popoverPosition?: "left" | "bottom" | "top" | "right";
    className?: string;
    buttonClassName?: string;
    icon?: MaterialSymbols;
    popoverContentClass?: string;
    children: React.ReactNode;
}

export default function AltPopover({
    popoverPosition = "left",
    className,
    buttonClassName,
    icon = "more_horiz",
    popoverContentClass,
    children,
}: AltPopoverProps) {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [showPopover, setShowPopover] = useState(false);

    function togglePopover() {
        setShowPopover((prev) => !prev);
    }

    useClickOutside(popoverRef, showPopover, setShowPopover);

    return (
        <div className={`${styles.popover} ${className ? className : ""}`}>
            <button
                onClick={togglePopover}
                className={`${styles.showPopoverButton} ${buttonClassName ? buttonClassName : ""}`}
            >
                <span className={`${styles.icon} material-symbols-rounded`}>
                    {icon}
                </span>
            </button>
            {showPopover ? (
                <div
                    ref={popoverRef}
                    className={`${styles.content} ${styles[popoverPosition]} ${popoverContentClass}`}
                >
                    {children}
                </div>
            ) : null}
        </div>
    );
}
