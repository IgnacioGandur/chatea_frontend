import { useFetcher } from "react-router";
import styles from "./MessageForm.module.css";

export default function MessageForm() {
    const fetcher = useFetcher();

    return (
        <fetcher.Form
            method="post"
            className={styles.messageForm}
        >
            <input
                type="text"
                name="message"
                id="message"
            />
            <button type="submit">
                <span className="material-symbols-rounded">send</span>
            </button>
        </fetcher.Form>
    );
}
