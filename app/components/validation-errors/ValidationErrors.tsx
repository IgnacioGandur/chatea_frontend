import styles from "./ValidationErrors.module.css";
import type { $ZodIssue } from "zod/v4/core";

interface ValidationErrorsProps {
    title: string;
    errors: $ZodIssue[];
}

export default function ValidationErrors({
    title,
    errors,
}: ValidationErrorsProps) {
    return (
        <section className={styles.validationErrors}>
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
