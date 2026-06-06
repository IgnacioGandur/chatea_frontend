import { NavLink } from "react-router";
import styles from "./EmptySection.module.css";
import type { MaterialSymbols } from "material-design-icons-literal-types";

interface EmptySectionProps {
    message: string;
    linkMessage?: string;
    linkPath?: string;
    icon: MaterialSymbols;
}

export default function EmptySection({
    message,
    linkMessage,
    linkPath,
    icon,
}: EmptySectionProps) {
    return (
        <section className={styles.empty}>
            <h1 className={styles.title}>{message}</h1>
            <span className={`material-symbols-rounded ${styles.icon}`}>
                {icon}
            </span>
            {linkMessage && linkPath ? (
                <NavLink
                    className={styles.link}
                    to={linkPath}
                >
                    {linkMessage}
                </NavLink>
            ) : null}
        </section>
    );
}
