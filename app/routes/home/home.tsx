import type { Route } from "./+types/home";
import Blob from "./blob/Blob";
import styles from "./home.module.css";
import classes from "~/css/classes.module.css";
import LogoSmall from "~/components/logo-small/LogoSmall";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Welcome to Chateá!" },
        { name: "description", content: "Welcome to React Router!" },
    ];
}

export function loader({}: Route.LoaderArgs) {}

export default function Home({}: Route.ComponentProps) {
    return (
        <main
            className={`
            ${styles.home}
            ${classes.flexColumnCenter}
        `}
        >
            <h1
                className={`
                    ${styles.title}
                    ${classes.textWithMainColorsGradient}
                `}
            >
                Chat your way, every day. Chateá!
            </h1>
            <div
                className={`
                    ${classes.flexColumnCenter}
                    ${styles.logoContainer}
                `}
            >
                <div className={styles.blobBackground}></div>
                <div
                    className={`
                        ${styles.blobWrapper}
                        ${classes.flexColumnCenter}
                `}
                >
                    <Blob
                        className={styles.blob}
                        glowIntensity="35px"
                    >
                        <div className={styles.iconInsideBlob}></div>
                    </Blob>
                </div>
            </div>
            <p className={styles.paragraph}>
                Stay close to your friends, send images, and keep the
                conversation going—wherever you are. Fast, fun, and easy to use.
            </p>
        </main>
    );
}
