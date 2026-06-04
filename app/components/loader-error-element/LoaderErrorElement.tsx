import {
    NavLink,
    useAsyncError,
    useNavigate,
    useRevalidator,
} from "react-router";
import styles from "./LoaderErrorElement.module.css";
import classes from "~/css/classes.module.css";
import type { MaterialSymbols } from "material-design-icons-literal-types";

interface LoaderErrorElementProps {
    title: string;
    icon: MaterialSymbols;
}

export default function LoaderErrorElement({
    title,
    icon,
}: LoaderErrorElementProps) {
    const error = useAsyncError() as { message?: string };
    const revalidator = useRevalidator();

    const isRetrying = revalidator.state === "loading";

    return (
        <section className={styles.error}>
            <h1
                className={`
                ${styles.title}
                ${classes.titleMain}
                `}
            >
                {title}
            </h1>
            <p
                className={`
                ${styles.message}
                ${classes.subText}
                `}
            >
                {isRetrying
                    ? "Trying again..."
                    : error?.message ||
                      "An unexpected error while trying to retrieve users from the datbase."}
            </p>
            <span
                className={`
                    ${isRetrying ? classes.spinIcon : ""}
                    ${styles.icon}
                    ${classes.iconWithGradientColors}
                    material-symbols-rounded
                    `}
            >
                {isRetrying ? "autorenew" : icon}
            </span>
            <div
                className={`
                    ${styles.buttons}
                    ${classes.flexRowCenter}
                `}
            >
                <NavLink
                    to="/"
                    className={`
                        ${styles.button}
                        ${classes.flexRowCenter}
                        ${classes.buttonHoverStyleMainColor}
                    `}
                >
                    <span className={`material-symbols-rounded ${styles.icon}`}>
                        home
                    </span>
                    <span className={styles.text}>Go Home</span>
                </NavLink>
                <button
                    className={`
                            ${styles.button}
                            ${classes.flexRowCenter}
                            ${classes.buttonHoverStyleMainColor}
                        `}
                    onClick={() => revalidator.revalidate()}
                >
                    <span className={`material-symbols-rounded ${styles.icon}`}>
                        autorenew
                    </span>
                    <span className={styles.text}>Try again</span>
                </button>
            </div>
        </section>
    );
}
