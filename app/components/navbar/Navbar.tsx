import styles from "./Navbar.module.css";
import { NavLink, useRouteLoaderData } from "react-router";
import LoggedUser from "./logged-user/LoggedUser";
import LogoSmall from "~/components/logo-small/LogoSmall";
import Notifications from "./notifications/Notifications";
import classes from "~/css/classes.module.css";
import type { RootLoaderData } from "~/types/RootLoaderData";
import type { MaterialSymbols } from "material-design-icons-literal-types";
import { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";

interface Link {
    text: string;
    icon: MaterialSymbols;
    to: string;
}

const sharedLinks: Link[] = [
    {
        text: "Users",
        icon: "diversity_1",
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

export default function Navbar() {
    const { user } = useRouteLoaderData("root") as RootLoaderData;

    const [links, setLinks] = useState<Link[]>([
        ...(user ? loggedLinks : unloggedLinks),
        ...sharedLinks,
    ]);

    useEffect(() => {
        setLinks(() => [
            ...(user ? loggedLinks : unloggedLinks),
            ...sharedLinks,
        ]);
    }, [user]);

    const elementLinks = user ? (
        <div
            className={`
                ${styles.loggedLinks}
                ${classes.flexRow}
            `}
        >
            {links.map((l) => {
                return (
                    <NavLink
                        key={l.text}
                        to={l.to}
                        className={({ isActive, isPending }) => {
                            const linkState = isActive
                                ? styles.active
                                : isPending
                                  ? styles.pending
                                  : "";

                            return `
                                ${styles.link}
                                ${classes.gridCenter}
                                ${classes.outline1}
                                ${linkState}
                            `;
                        }}
                    >
                        {({ isActive, isPending }) => {
                            return isPending ? (
                                <div className={styles.loaderWrapper}>
                                    <BarLoader
                                        color="var(--color-main)"
                                        width={32}
                                    />
                                </div>
                            ) : (
                                <>
                                    <span
                                        className={`
                                            ${isActive ? classes.textWithMainColorsGradient : ""}
                                            ${styles.icon}
                                            material-symbols-rounded
                                        `}
                                    >
                                        {l.icon}
                                    </span>
                                    <span className={styles.text}>
                                        {l.text}
                                    </span>
                                </>
                            );
                        }}
                    </NavLink>
                );
            })}
        </div>
    ) : (
        <div
            className={`
                ${styles.unloggedLinks}
                ${classes.flexRow}
            `}
        >
            {links.map((l) => {
                return (
                    <NavLink
                        className={({ isActive, isPending }) => {
                            const activeLinkClasses = `
                                ${styles.link}
                                ${classes.flexRowStartCenter}
                                ${classes.outline1}
                                ${isActive ? styles.active : isPending ? styles.pending : ""}
                            `;

                            return activeLinkClasses;
                        }}
                        to={l.to}
                    >
                        <span className={styles.text}>{l.text}</span>
                    </NavLink>
                );
            })}
        </div>
    );

    return (
        <nav className={styles.navbar}>
            <div className={styles.iconsSection}>
                <LogoSmall />
                <h2 className={styles.title}>Chateá!</h2>
            </div>
            {elementLinks}
            {user ? (
                <div
                    className={`
                    ${classes.flexRowCenter}
                    ${styles.wrapper}
                    `}
                >
                    <Notifications />
                    <LoggedUser
                        firstName={user.firstName}
                        lastName={user.lastName}
                        username={user.username}
                        profilePictureUrl={user.profilePictureUrl}
                    />
                </div>
            ) : null}
        </nav>
    );
}
