import styles from "./LoggedUser.module.css";
import { NavLink, useFetcher } from "react-router";
import Popover from "~/components/popover/Popover";

interface LoggedUserProps {
    firstName: string;
    lastName: string;
    username: string;
    profilePictureUrl: string;
}

export default function LoggedUser({
    firstName,
    lastName,
    username,
    profilePictureUrl,
}: LoggedUserProps) {
    const fetcher = useFetcher();

    const userInfo = (
        <div className={styles.user}>
            <h4 className={styles.name}>
                {firstName} {lastName}
            </h4>
            <span className={styles.username}>@{username}</span>
            <img
                className={styles.ppf}
                src={profilePictureUrl}
                alt={`${firstName} ${lastName}`}
            />
        </div>
    );

    return (
        <Popover
            anchorName="--userInfo"
            popoverTarget="links"
            buttonContent={userInfo}
            altPopoverClass={styles.altPopover}
        >
            <div className={styles.links}>
                <NavLink
                    className={styles.link}
                    to="/dashboard"
                >
                    <span className={`material-symbols-rounded ${styles.icon}`}>
                        dashboard
                    </span>
                    <span className={styles.text}>Dashboard</span>
                </NavLink>
                <div className={styles.separator}></div>
                <fetcher.Form
                    action="/logout"
                    method="post"
                >
                    <button
                        className={`${styles.link} ${styles.logout}`}
                        type="submit"
                    >
                        <span
                            className={`material-symbols-rounded ${styles.icon}`}
                        >
                            output_circle
                        </span>
                        <span className={styles.text}>Logout</span>
                    </button>
                </fetcher.Form>
            </div>
        </Popover>
    );
}
