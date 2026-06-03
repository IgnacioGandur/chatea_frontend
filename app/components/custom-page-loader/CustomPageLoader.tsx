import styles from "./CustomPageLoader.module.css";
import { BarLoader } from "react-spinners";

interface CustomPageLoaderProps {
    message: string;
    color: string;
}

export default function CustomPageLoader({
    message,
    color,
}: CustomPageLoaderProps) {
    return (
        <section className={styles.customPageLoader}>
            <h1 className={styles.title}>{message}</h1>
            <BarLoader
                className={styles.loader}
                color={color}
            />
        </section>
    );
}
