import styles from "./Navbar.module.css";
import { useRouteLoaderData } from "react-router";
import LoggedUser from "./logged-user/LoggedUser";
import LogoSmall from "~/components/logo-small/LogoSmall";
import Notifications from "./notifications/Notifications";
import classes from "~/css/classes.module.css";
import type { RootLoaderData } from "~/types/RootLoaderData";

export default function Navbar() {
    const { user } = useRouteLoaderData("root") as RootLoaderData;

    return (
        <nav className={styles.navbar}>
            <div className={styles.iconSection}>
                <LogoSmall />
                <h2 className={styles.title}>Chateá!</h2>
            </div>
            {user ? (
                <div
                    className={`
                    ${classes.flexRowCenter}
                    ${styles.wrapper}
                    `}
                >
                    <Notifications />
                    <LoggedUser
                        firstName={user.firstName}
                        lastName={user.lastName}
                        username={user.username}
                        profilePictureUrl={user.profilePictureUrl}
                    />
                </div>
            ) : null}
        </nav>
    );
}
