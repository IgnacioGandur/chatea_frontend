import { useEffect, useRef, useState } from "react";
import styles from "./Sidebar.module.css";
import { AnimatePresence, motion } from "motion/react";
import { NavLink, useRouteLoaderData } from "react-router";
import type { MaterialSymbols } from "material-design-icons-literal-types";
import LogoSmall from "../logo-small/LogoSmall";

interface Link {
    text: string;
    icon: MaterialSymbols;
    to: string;
}

const unloggedLinks: Link[] = [
    {
        text: "Home",
        icon: "home",
        to: "/",
    },
    {
        text: "Login",
        icon: "login",
        to: "/login",
    },
    {
        text: "Register",
        icon: "signature",
        to: "/register",
    },
];

const loggedLinks: Link[] = [
    {
        text: "Conversations",
        icon: "conversation",
        to: "conversations",
    },
    {
        text: "Users",
        icon: "groups",
        to: "users",
    },
    {
        text: "Friends",
        icon: "handshake",
        to: "friendships",
    },
];

export default function Sidebar() {
    const rootData = useRouteLoaderData("root");
    const [links, setLinks] = useState<Link[]>(
        rootData ? loggedLinks : unloggedLinks,
    );
    const [isOpen, setIsOpen] = useState(false);
    const sidebarRef = useRef<HTMLElement | null>(null);

    function toggleSidebar() {
        setIsOpen((prevState) => !prevState);
    }

    // Handle closing of sidebar.
    useEffect(() => {
        function handleClick(e: PointerEvent) {
            if (sidebarRef && sidebarRef.current && isOpen) {
                if (!sidebarRef.current.contains(e.target as Node)) {
                    setIsOpen(false);
                }
            }
        }

        function handleEscapeKey(e: KeyboardEvent) {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
        }

        document.addEventListener("click", handleClick);
        document.addEventListener("keydown", handleEscapeKey);

        return () => document.removeEventListener("click", handleClick);
    }, [isOpen]);

    useEffect(() => {
        setLinks(rootData ? loggedLinks : unloggedLinks);
    }, [rootData]);

    return (
        <AnimatePresence>
            {isOpen ? (
                <motion.aside
                    className={styles.sidebar}
                    key="sidebar"
                    ref={sidebarRef}
                    initial={{
                        left: "-100%",
                    }}
                    animate={{
                        left: "0%",
                    }}
                    exit={{
                        left: "-100%",
                    }}
                >
                    <div className={styles.logoSection}>
                        <LogoSmall />
                        <h2 className={styles.title}>Chateá!</h2>
                        <button
                            onClick={toggleSidebar}
                            title="Close sidebar."
                            className={styles.closeSidebarButton}
                        >
                            <span
                                className={`material-symbols-rounded ${styles.icon}`}
                            >
                                arrow_menu_close
                            </span>
                        </button>
                    </div>
                    <div className={styles.links}>
                        {links.map((link) => {
                            return (
                                <NavLink
                                    key={link.to}
                                    className={({ isActive, isPending }) =>
                                        isActive
                                            ? `${styles.link} ${styles.active}`
                                            : isPending
                                              ? `${styles.link} ${styles.pending}`
                                              : styles.link
                                    }
                                    to={link.to}
                                >
                                    <span
                                        className={`material-symbols-rounded ${styles.icon}`}
                                    >
                                        {link.icon}
                                    </span>
                                    <div className={styles.separator}></div>
                                    <span className={styles.text}>
                                        {link.text}
                                    </span>
                                </NavLink>
                            );
                        })}
                    </div>
                    <p className={styles.author}>
                        <span className={styles.message}>
                            Made by Ignacio Gandur
                        </span>
                        <span
                            className={`${styles.icon} material-symbols-rounded`}
                        >
                            wand_stars
                        </span>
                    </p>
                </motion.aside>
            ) : (
                <motion.button
                    key="hide-sidebar-button"
                    initial={{
                        left: "-100%",
                    }}
                    animate={{
                        left: "calc(var(--size-4) * 1)",
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
