import { useState } from "react";
import styles from "./Sidebar.module.css";
import { AnimatePresence, motion } from "motion/react";
import { NavLink } from "react-router";
import type { MaterialSymbols } from "material-design-icons-literal-types";

interface Link {
    text: string;
    icon: MaterialSymbols;
    to: string;
}

const links: Link[] = [
    {
        text: "Home",
        icon: "home",
        to: "/",
    },
    {
        text: "Register",
        icon: "signature",
        to: "/register",
    },
];

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);

    function toggleSidebar() {
        setIsOpen((prevState) => !prevState);
    }

    return (
        <AnimatePresence>
            {isOpen ? (
                <motion.aside
                    key="sidebar"
                    initial={{
                        left: "-100%",
                    }}
                    animate={{
                        left: "0%",
                    }}
                    exit={{
                        left: "-100%",
                    }}
                    className={styles.sidebar}
                >
                    <p>sidebar</p>
                    <div className={styles.links}>
                        {links.map((link) => {
                            return (
                                <NavLink
                                    className={({ isActive, isPending }) =>
                                        isActive
                                            ? `${styles.link} ${styles.active}`
                                            : isPending
                                              ? `${styles.link} ${styles.pending}`
                                              : styles.link
                                    }
                                    to={link.to}
                                >
                                    {link.text}
                                </NavLink>
                            );
                        })}
                    </div>
                    <button onClick={toggleSidebar}>Close</button>
                </motion.aside>
            ) : (
                <motion.button
                    key="hide-sidebar-button"
                    initial={{
                        left: "-100%",
                    }}
                    animate={{
                        left: "calc(var(--size-4) * 2)",
                    }}
                    exit={{
                        left: "-100%",
                    }}
                    className={styles.showSidebarButton}
                    onClick={toggleSidebar}
                >
                    <span className="material-symbols-rounded">menu</span>
                </motion.button>
            )}
        </AnimatePresence>
    );
}
