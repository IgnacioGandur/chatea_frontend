import type { MaterialSymbols } from "material-design-icons-literal-types";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
    title: string;
    icon: MaterialSymbols;
}

export default function PageHeader({ title, icon }: PageHeaderProps) {
    return (
        <header className={styles.header}>
            <div className={styles.text}>
                <span className={`${styles.icon} material-symbols-rounded`}>
                    {icon}
                </span>
                <div className={styles.separator}></div>
                <h2 className={styles.title}>{title}</h2>
            </div>
        </header>
    );
}
