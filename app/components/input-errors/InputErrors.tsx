import type { Error } from "~/types/error";
import styles from "./InputErrors.module.css";

interface InputErrorsProps {
    message: string;
    errors: Error[];
}

export default function InputErrors({ message, errors }: InputErrorsProps) {
    return (
        <section className={styles.errors}>
            <h3 className={styles.message}>{message}</h3>
            <div className={styles.container}>
                {errors.map((error) => {
                    return (
                        <li
                            key={error.path}
                            className={styles.error}
                        >
                            {error.msg}
                        </li>
                    );
                })}
            </div>
        </section>
    );
}
