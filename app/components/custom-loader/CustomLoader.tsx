import styles from "./CustomLoader.module.css";
import { MoonLoader } from "react-spinners";

interface CustomLoaderProps {
    message: string;
}

export default function CustomLoader({
    message = "Submitting...",
}: CustomLoaderProps) {
    return (
        <section className={styles.customLoader}>
            <h3 className={styles.title}>{message}</h3>
            <MoonLoader
                size="32px"
                color="var(--color-main)"
            />
        </section>
    );
}
