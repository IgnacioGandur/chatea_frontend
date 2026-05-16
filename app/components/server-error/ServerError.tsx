import styles from "./ServerError.module.css";

export default function ServerError() {
    return (
        <section className={styles.serverError}>
            <h2 className={styles.title}>
                <span className="material-symbols-rounded">bomb</span>
                <span>Server error</span>
            </h2>
            <p className={styles.text}>
                We were not able to connect with the backend. The website will
                not work properly, please try again later...
            </p>
        </section>
    );
}
