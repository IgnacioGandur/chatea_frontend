import type { MaterialIcons } from "material-design-icons-literal-types";
import styles from "./CustomInput.module.css";
import { useState, type ChangeEvent } from "react";

interface CustomInput {
    type: "text" | "password";
    labelText: string;
    id: string;
    icon: MaterialIcons;
    placeholder: string;
    clarification?: string;
    required: boolean;
    name: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export default function CustomInput({
    type,
    labelText,
    icon,
    id,
    placeholder,
    clarification,
    required,
    name,
    value,
    onChange,
}: CustomInput) {
    const [showPassword, setShowPassword] = useState(false);

    function togglePasswordVisibility() {
        setShowPassword((prevState) => !prevState);
    }

    return (
        <div className={styles.customInput}>
            <label
                className={styles.label}
                htmlFor={id}
            >
                {labelText}
            </label>
            <div className={styles.wrapper}>
                <span className="material-symbols-rounded">{icon}</span>
                <input
                    required={required}
                    className={styles.input}
                    type={
                        type === "password" && !showPassword
                            ? "password"
                            : "text"
                    }
                    id={id}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                />
                {type === "password" ? (
                    <button
                        type="button"
                        title={showPassword ? "Hide password" : "Show password"}
                        onClick={togglePasswordVisibility}
                        className={styles.togglePasswordVisibility}
                    >
                        <span className="material-symbols-rounded">
                            {showPassword ? "visibility_off" : "visibility"}
                        </span>
                    </button>
                ) : null}
            </div>
            {clarification ? (
                <p className={styles.clarification}>{clarification}</p>
            ) : null}
        </div>
    );
}
