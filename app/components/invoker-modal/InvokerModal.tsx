import type React from "react";
import styles from "./InvokerModal.module.css";
import classes from "~/css/classes.module.css";

interface InvokerModalProps {
    id: string;
    children: React.ReactNode;
    className: string;
}

export default function InvokerModal({
    id,
    className,
    children,
}: InvokerModalProps) {
    return (
        <dialog
            className={styles.modal}
            id={id}
        >
            <button
                title="Close"
                aria-label="Close participants modal"
                className={`${styles.closeModalButton} ${classes.roundDefaultButton}`}
                commandfor={id}
                command="close"
            >
                <span className={`${styles.icon} material-symbols-rounded`}>
                    close
                </span>
            </button>
            <main
                className={`${styles.modalContent} ${className ? className : ""}`}
            >
                {children}
            </main>
        </dialog>
    );
}
