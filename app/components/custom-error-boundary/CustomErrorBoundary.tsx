import styles from "./CustomErrorBoundary.module.css";
import { isRouteErrorResponse, NavLink } from "react-router";
import notFoundImage from "/images/404.svg";
import badRequestImage from "/images/400.svg";

interface CustomErrorBoundaryProps {
    error: unknown;
}

export function CustomErrorBoundary({ error }: CustomErrorBoundaryProps) {
    if (isRouteErrorResponse(error)) {
        const errorMessage =
            typeof error.data === "string" ? error.data : "An error occurred.";

        return (
            <main className={styles.errorBoundary}>
                <section className={styles.details}>
                    <header className={styles.header}>
                        <h1 className={styles.title}>{errorMessage}</h1>
                    </header>
                    <span className={styles.code}>{error.status}</span>
                    <p className={styles.description}>{error.statusText}</p>
                    <NavLink
                        className={styles.goHome}
                        to="/"
                    >
                        <span
                            className={`material-symbols-rounded ${styles.icon}`}
                        >
                            home
                        </span>
                        <span className={styles.text}>Take me home</span>
                    </NavLink>
                </section>
                <section className={styles.svg}>
                    <img
                        src={
                            error.status === 404
                                ? notFoundImage
                                : badRequestImage
                        }
                        alt="Bad request"
                        className={styles.image}
                    />
                </section>
            </main>
        );
    }

    if (error instanceof Error) {
        return (
            <div className={styles.errorPage}>
                <h1>Application Error</h1>
                <p className={styles.error}>{error.message}</p>
            </div>
        );
    }

    return (
        <div className={styles.errorPage}>
            <h1>Unknown Error Occurred.</h1>
        </div>
    );
}
