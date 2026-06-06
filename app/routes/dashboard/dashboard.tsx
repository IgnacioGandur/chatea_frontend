import PageHeader from "~/components/page-header/PageHeader";
import styles from "./dashboard.module.css";
import classes from "~/css/classes.module.css";

import { Outlet, NavLink, useSearchParams } from "react-router";

export default function Dashboard() {
    const [searchParams] = useSearchParams();
    const welcomeMessage = searchParams.get("welcome");
    return (
        <main className={styles.dashboard}>
            {welcomeMessage ? <p>{welcomeMessage}</p> : null}
            <PageHeader
                icon="dashboard"
                title="Dashboard"
            />
            <aside>
                <NavLink to="/dashboard">Index</NavLink>
                <NavLink to="/dashboard/settings">Settings</NavLink>
            </aside>
            <button className={classes.roundDefaultButton}>
                <span
                    className={`${classes.iconInsideRoundDefaultButton} material-symbols-rounded`}
                >
                    face
                </span>
            </button>
            <Outlet />
        </main>
    );
}
