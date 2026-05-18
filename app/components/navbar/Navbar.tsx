import styles from "./Navbar.module.css";
import { useFetcher } from "react-router";
import { MoonLoader } from "react-spinners";
import { useRouteLoaderData } from "react-router";
import type { User } from "../../../generated/prisma/client";
import LoggedUser from "./logged-user/LoggedUser";

export default function Navbar() {
    const data = useRouteLoaderData("root") as User;
    const fetcher = useFetcher();
    const isNotIdle = fetcher.state !== "idle";

    return (
        <nav className={styles.navbar}>
            <p>navlink elements goes here</p>
            {data ? (
                isNotIdle ? (
                    <div className={styles.loader}>
                        <MoonLoader
                            size="18px"
                            color="var(--color-main-light)"
                        />
                    </div>
                ) : (
                    <fetcher.Form
                        action="/logout"
                        method="post"
                        className={styles.logout}
                    >
                        <button type="submit">
                            <span className="material-symbols-rounded">
                                logout
                            </span>
                        </button>
                    </fetcher.Form>
                )
            ) : null}
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
