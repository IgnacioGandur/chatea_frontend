import styles from "./LoggedUser.module.css";
import { NavLink, useFetcher } from "react-router";
import { useEffect, useRef, useState } from "react";

interface LoggedUserProps {
    firstName: string;
    lastName: string;
    username: string;
    profilePictureUrl: string;
}

const links = [
    {
        to: "/dashboard",
        text: "dashboard",
    },
];

export default function LoggedUser({
    firstName,
    lastName,
    username,
    profilePictureUrl,
}: LoggedUserProps) {
    const fetcher = useFetcher();
    const menuRef = useRef<HTMLElement | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    function toggleOpen() {
        setIsOpen((prevState) => !prevState);
    }

    const userInfo = (
        <div className={styles.user}>
            <div className={styles.names}>
                <h4 className={styles.name}>
                    {firstName} {lastName}
                </h4>
                <span className={styles.username}>@{username}</span>
            </div>
            <img
                src={profilePictureUrl}
                alt={`${firstName} ${lastName}`}
                className={styles.ppf}
            />
        </div>
    );

    useEffect(() => {
        function handleClick(e: PointerEvent) {
            if (menuRef && menuRef.current && isOpen) {
                if (!menuRef.current.contains(e.target as Node)) {
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

    return isOpen ? (
        <div
            onClick={toggleOpen}
            className={styles.menuOpen}
        >
            {userInfo}
            <div className={styles.absoluteContainer}>
                <ul className={styles.links}>
                    {links.map((link) => {
                        return (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                className={styles.link}
                            >
                                {link.text}
                            </NavLink>
                        );
                    })}
                    <fetcher.Form
                        action="/logout"
                        method="post"
                        className={styles.link}
                    >
                        <button type="submit">logout</button>
                    </fetcher.Form>
                </ul>
            </div>
        </div>
    ) : (
        <button
            className={styles.menuClosed}
            onClick={toggleOpen}
        >
            {userInfo}
        </button>
    );
}
