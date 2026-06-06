import type { MaterialSymbols } from "material-design-icons-literal-types";
import styles from "./RoundInfoTooltip.module.css";
import classes from "~/css/classes.module.css";
import { useId } from "react";

interface RoundInfoTooltipProps {
    className?: string;
    icon: MaterialSymbols;
    tooltipMessage: string;
}

export default function RoundInfoTooltip({
    className,
    icon,
    tooltipMessage,
}: RoundInfoTooltipProps) {
    const tooltipId = useId();

    return (
        <div
            className={`
                ${styles.roundInfoTooltip}
                ${className ? className : ""}
            `}
        >
            <button
                type="button"
                className={`
                    ${styles.button}
                    ${classes.roundDefaultButton}
                    `}
                aria-labelledby={tooltipId}
            >
                <span
                    className={`${classes.defaultIcon} material-symbols-rounded`}
                >
                    {icon}
                </span>
                <span className={classes.srOnly}>More information</span>
            </button>
            <span
                id={tooltipId}
                role="tooltip"
                className={`${styles.message} ${classes.noWrap}`}
            >
                {tooltipMessage}
            </span>
        </div>
    );
}
