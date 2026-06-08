import styles from "./ValidationErrors.module.css";
import type { $ZodIssue } from "zod/v4/core";

interface ValidationErrorsProps {
    roundBorders?: boolean;
    className?: string;
    title: string;
    errors: $ZodIssue[];
}

export default function ValidationErrors({
    roundBorders = true,
    className,
    title,
    errors,
}: ValidationErrorsProps) {
    return (
        <section
            style={roundBorders ? {} : { borderRadius: "0px" }}
            className={`${styles.validationErrors} ${className ? className : ""}`}
        >
            <h3 className={styles.title}>{title}</h3>
            <ul className={styles.errors}>
                {errors.map((e, i) => {
                    return (
                        <li
                            key={i}
                            className={styles.error}
                        >
                            {e.message}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
