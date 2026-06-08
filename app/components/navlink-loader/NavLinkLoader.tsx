import styles from "./NavLinkLoader.module.css";
import classes from "~/css/classes.module.css";
import { PuffLoader } from "react-spinners";
import type { CSSProperties } from "react";

interface NavLinkLoaderProps {
    className?: string;
    message: string;
    size?: number;
    style?: CSSProperties;
}

export default function NavLinkLoader({
    message,
    className,
    size = 38,
    style,
}: NavLinkLoaderProps) {
    return (
        <div
            style={style}
            className={`
                ${className ? className : ""}
                ${styles.loader}
                ${classes.suspenseBackgroundAnimation}
            `}
        >
            <PuffLoader
                size={size}
                color="var(--color-secondary-light)"
            />
            <p className={`${classes.subText}`}>{message}</p>
        </div>
    );
}
