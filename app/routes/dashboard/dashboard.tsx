import styles from "./dashboard.module.css";

import { Outlet, NavLink, useSearchParams } from "react-router";

export default function Dashboard() {
    const [searchParams] = useSearchParams();
    const welcomeMessage = searchParams.get("welcome");
    return (
        <main className={styles.dashboard}>
            {welcomeMessage ? <p>{welcomeMessage}</p> : null}
            <aside>
                <NavLink to="/dashboard">Index</NavLink>
                <NavLink to="/dashboard/settings">Settings</NavLink>
            </aside>
            <Outlet />
        </main>
    );
}
