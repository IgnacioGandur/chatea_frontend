import type { MaterialSymbols } from "material-design-icons-literal-types";
import styles from "./RoundInfoTooltip.module.css";
import classes from "~/css/classes.module.css";
import { useId } from "react";

interface RoundInfoTooltipProps {
    className?: string;
    buttonClassName?: string;
    icon: MaterialSymbols;
    iconClassName?: string;
    tooltipMessage: string;
}

export default function RoundInfoTooltip({
    className,
    buttonClassName,
    icon,
    iconClassName,
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
                className={`
                    ${buttonClassName ? buttonClassName : ""}
                    ${styles.button}
                    ${classes.roundDefaultButton}
                `}
                type="button"
                aria-labelledby={tooltipId}
            >
                <span
                    className={`${classes.defaultIcon} ${iconClassName ? iconClassName : ""} material-symbols-rounded`}
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
