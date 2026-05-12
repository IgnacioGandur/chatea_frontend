import styles from "./dashboard.module.css";

import { Outlet, NavLink } from "react-router";

export default function Dashboard() {
    return (
        <main className={styles.dashboard}>
            <aside>
                <NavLink to="/dashboard">Index</NavLink>
                <NavLink to="/dashboard/settings">Settings</NavLink>
            </aside>
            <Outlet />
        </main>
    );
}
