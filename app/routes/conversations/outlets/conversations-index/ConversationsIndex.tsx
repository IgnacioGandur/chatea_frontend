import { NavLink } from "react-router";
import styles from "./ConversationsIndex.module.css";
import Logo from "./logo/Logo";

export default function ConversationsIndex() {
    return (
        <div className={styles.index}>
            <h1 className={styles.title}>Your Conversations</h1>
            <Logo />
            <NavLink
                to="/users"
                className={styles.link}
            >
                Find new friends here!
            </NavLink>
        </div>
    );
}
