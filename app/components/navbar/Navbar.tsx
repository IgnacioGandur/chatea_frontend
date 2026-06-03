import styles from "./Navbar.module.css";
import { useRouteLoaderData } from "react-router";
import type { User } from "../../../generated/prisma/client";
import LoggedUser from "./logged-user/LoggedUser";
import LogoSmall from "~/components/logo-small/LogoSmall";

export default function Navbar() {
    const data = useRouteLoaderData("root") as User;

    return (
        <nav className={styles.navbar}>
            <div className={styles.iconSection}>
                <LogoSmall />
                <h2 className={styles.title}>Chateá!</h2>
            </div>
            {data ? (
                <LoggedUser
                    firstName={data.firstName}
                    lastName={data.lastName}
                    username={data.username}
                    profilePictureUrl={data.profilePictureUrl}
                />
            ) : null}
        </nav>
    );
}
