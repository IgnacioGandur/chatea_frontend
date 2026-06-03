import type { MaterialSymbols } from "material-design-icons-literal-types";
import styles from "./PillButton.module.css";

interface PillButtonProps {
    buttonAriaLabel: string;
    altButtonClassName?: string;
    buttonTitle: string;
    includeEmptySpace: boolean;
    includeIcon: boolean;
    icon?: MaterialSymbols;
    type: "button" | "submit";
    buttonText: string;
    name?: string;
    value?: string | number;
}

export default function PillButton({
    buttonAriaLabel,
    altButtonClassName,
    buttonTitle,
    includeEmptySpace,
    includeIcon,
    icon,
    type,
    buttonText,
    name,
    value,
}: PillButtonProps) {
    return (
        <button
            name={name}
            value={value}
            aria-label={buttonAriaLabel}
            type={type}
            title={buttonTitle}
            className={`${styles.button} ${altButtonClassName}`}
        >
            {includeEmptySpace && <div className="empty"></div>}
            <span className={styles.text}>{buttonText}</span>
            {includeIcon && (
                <span className={`material-symbols-rounded ${styles.icon}`}>
                    {icon}
                </span>
            )}
        </button>
    );
}
