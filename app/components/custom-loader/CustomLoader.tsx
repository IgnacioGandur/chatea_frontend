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
            <h3>{message}</h3>
            <MoonLoader
                size="36px"
                color="var(--color-main)"
            />
        </section>
    );
}
