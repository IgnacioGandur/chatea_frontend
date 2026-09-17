import styles from "./GradientButton.module.css";

interface GradientButtonProps {
    className?: string;
    glow?: boolean;
    type: "submit" | "button";
    children: string;
}

export default function GradientButton({
    className,
    glow = false,
    type,
    children,
}: GradientButtonProps) {
    return (
        <div
            className={`
                ${className ?? ""}
                ${styles.buttonWrapper}
            `}
        >
            <button
                type={type}
                className={`
                    ${styles.button}
                `}
            >
                {children}
            </button>
            {glow && <div className={styles.glow}></div>}
        </div>
    );
}
