import { useEffect, useRef, useState } from "react";
import styles from "./Sidebar.module.css";
import classes from "~/css/classes.module.css";
import { AnimatePresence, motion } from "motion/react";
import { NavLink, useRouteLoaderData } from "react-router";
import type { MaterialSymbols } from "material-design-icons-literal-types";
import LogoSmall from "../logo-small/LogoSmall";
import type { RootLoaderData } from "~/types/RootLoaderData";
import { useClickOutside } from "~/hooks/useClickOutside";

interface Link {
    text: string;
    icon: MaterialSymbols;
    to: string;
}

const sharedLinks: Link[] = [
    {
        text: "Users",
        icon: "groups",
        to: "users",
    },
    {
        text: "Groups",
        icon: "communities",
        to: "groups",
    },
    {
        text: "About",
        icon: "info",
        to: "/about",
    },
];

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
        text: "Dashboard",
        icon: "dashboard",
        to: "dashboard",
    },
    {
        text: "Conversations",
        icon: "conversation",
        to: "conversations",
    },
    {
        text: "Friends",
        icon: "handshake",
        to: "friends",
    },
];

// TODO: Display a loader while the link is loading and then close the sidebar.
export default function Sidebar() {
    const { user: rootData } = useRouteLoaderData("root") as RootLoaderData;
    const [links, setLinks] = useState<Link[]>(
        rootData ? loggedLinks : unloggedLinks,
    );
    const [isOpen, setIsOpen] = useState(false);
    const sidebarRef = useRef<HTMLElement | null>(null);

    function toggleSidebar() {
        setIsOpen((prevState) => !prevState);
    }

    useClickOutside(sidebarRef, isOpen, setIsOpen);

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
                        {[...links, ...sharedLinks].map((link) => {
                            return (
                                <NavLink
                                    onClick={() => setIsOpen(false)}
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
                                        className={`material-symbols-rounded ${styles.icon} ${classes.iconWithGradientColors}`}
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
                <motion.div
                    className={styles.ring}
                    initial={{
                        left: "-100%",
                    }}
                    animate={{
                        left: "calc(var(--size-4) * 1)",
                    }}
                    exit={{
                        left: "-100%",
                    }}
                >
                    <motion.button
                        className={styles.showSidebarButton}
                        aria-label="Open navigation sidebar"
                        title="Open sidebar"
                        key="hide-sidebar-button"
                        onClick={toggleSidebar}
                    >
                        <span className="material-symbols-rounded">menu</span>
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
