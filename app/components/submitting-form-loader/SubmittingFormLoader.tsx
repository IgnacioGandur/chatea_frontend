import styles from "./SubmittingFormLoader.module.css";

interface SubmittingFormLoaderProps {
    message: string;
}

export default function SubmittingFormLoader({
    message,
}: SubmittingFormLoaderProps) {
    return (
        <div className={styles.submittingFormLoader}>
            <p>{message}</p>
        </div>
    );
}
