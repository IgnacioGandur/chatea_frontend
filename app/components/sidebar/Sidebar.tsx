import { useState } from "react";
import styles from "./Sidebar.module.css";
import { AnimatePresence, motion } from "motion/react";

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
                    show
                </motion.button>
            )}
        </AnimatePresence>
    );
}
