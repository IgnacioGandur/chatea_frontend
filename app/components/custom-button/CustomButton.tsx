import styles from "./CustomButton.module.css";

interface CustomButtonProps {
    text: string;
    type: "submit" | "button";
}

export default function CustomButton({ text, type }: CustomButtonProps) {
    return (
        <button
            type={type}
            className={styles.customButton}
        >
            {text}
        </button>
    );
}
