import { NavLink } from "react-router";
import styles from "./Navbar.module.css";

export default function Navbar() {
    return (
        <nav className={styles.navbar}>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/register">Register</NavLink>
        </nav>
    );
}
