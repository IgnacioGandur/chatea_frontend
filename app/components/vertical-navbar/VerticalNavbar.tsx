import { NavLink, useFetcher } from "react-router";
import type { MaterialSymbol } from "material-symbols";
import iconLight from "~/../public/images/icon_light.svg";
import iconDark from "~/../public/images/icon_dark.svg";
import classes from "~/css/classes.module.css";
import styles from "./VerticalNavbar.module.css";
import { useState } from "react";
import useRootData from "~/hooks/useRootData";
import {
    AnimatePresence,
    motion,
    type TargetAndTransition,
} from "motion/react";

type Link = {
    to: string;
    text: string;
    icon: MaterialSymbol;
};

const commonLinks: Link[] = [
    {
        to: "/about",
        icon: "info",
        text: "about",
    },
];

const loggedLinks: Link[] = [
    {
        to: "/conversations",
        icon: "conversation",
        text: "conversations",
    },
    {
        to: "/dashboard",
        icon: "dashboard_2",
        text: "dashboard",
    },
    {
        to: "/users",
        icon: "group",
        text: "users",
    },
    {
        to: "/groups",
        icon: "group_work",
        text: "groups",
    },
    {
        to: "/friends",
        icon: "diversity_2",
        text: "friends",
    },
];

const unloggedLinks: Link[] = [
    {
        to: "/login",
        icon: "login",
        text: "login",
    },
    {
        to: "/register",
        icon: "signature",
        text: "register",
    },
];

export default function VerticalNavbar() {
    const data = useRootData();
    const user = data?.user;
    const name = `${user?.firstName} ${user?.lastName}`;

    const links: Link[] = [
        ...(user ? loggedLinks : unloggedLinks),
        ...commonLinks,
    ];

    const fetcher = useFetcher();

    const [isOpen, setIsOpen] = useState(false);

    const logoHtml = (
        <picture>
            <source
                srcSet={iconLight}
                media="(prefers-color-scheme: dark)"
            />
            <img
                src={iconDark}
                alt="Website logo"
                className={`
                    ${styles.logo}
                    ${classes.correctImage}
                    `}
            />
        </picture>
    );

    const ppfHtml = (
        <img
            src={user?.profilePictureUrl}
            alt={name}
            className={`
                ${styles.ppf}
                ${classes.correctImage}
                `}
        />
    );

    const linksHtml = (
        <ul
            className={`
                ${styles.links}
                ${classes.flexColumn}
            `}
        >
            {links.map((l) => {
                return (
                    <div
                        key={l.text}
                        className={`
                            ${styles.linkWrapper}
                            ${classes.flexRow}
                        `}
                    >
                        <NavLink
                            to={l.to}
                            className={({ isActive, isPending }) => {
                                return `
                                ${styles.link}
                                ${classes.flexRowCenter}
                                ${isActive ? styles.active : ""}
                                ${isPending ? styles.pending : ""}
                            `;
                            }}
                        >
                            {({ isPending }) => {
                                return (
                                    <>
                                        <span
                                            className={`
                                                material-symbols-rounded
                                                ${styles.icon}
                                                ${isPending ? classes.spinIcon : ""}
                                            `}
                                        >
                                            {isPending
                                                ? "progress_activity"
                                                : l.icon}
                                        </span>
                                        <span className={styles.text}>
                                            {l.text}
                                        </span>
                                    </>
                                );
                            }}
                        </NavLink>
                    </div>
                );
            })}
            ;
        </ul>
    );

    const emptyDivHtml = <div className={styles.empty}></div>;
    const separatorHtml = <div className={styles.separator}></div>;

    // Motion animations
    const motionInitial: TargetAndTransition = {
        transform: "translateX(-100%)",
        opacity: 0,
        backdropFilter: "blur(12px)",
    };

    const motionAnimate: TargetAndTransition = {
        transform: "translateX(0%)",
        opacity: 1,
        backdropFilter: "blur(0px)",
    };

    const motionExit: TargetAndTransition = {
        transform: "translateX(-100%)",
        opacity: 0,
        backdropFilter: "blur(12px)",
    };

    return (
        <AnimatePresence mode="wait">
            {isOpen ? (
                <motion.nav
                    key="navbar:open"
                    onMouseLeave={() => setIsOpen(false)}
                    initial={motionInitial}
                    animate={motionAnimate}
                    exit={motionExit}
                    className={`
                        ${styles.navbar}
                        ${classes.flexColumnAlignStartJustifySpaceBetween}
                        ${styles.opened}
                    `}
                >
                    <div
                        className={`
                            ${styles.logoSection}
                            ${classes.flexRowAlignCenterJustifyBetween}
                        `}
                    >
                        {logoHtml}
                        <span
                            aria-hidden
                            className={styles.text}
                        >
                            Chateá!
                        </span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className={`
                                ${styles.closeNavbar}
                                ${classes.gridCenter}
                            `}
                        >
                            <span
                                className={`
                            material-symbols-rounded
                            ${styles.icon}
                        `}
                            >
                                chevron_left
                            </span>
                        </button>
                    </div>
                    {separatorHtml}
                    {linksHtml}
                    {user ? (
                        <div className={styles.user}>
                            {ppfHtml}
                            <p className={styles.name}>{name}</p>
                            <span
                                className={`
                                    ${styles.username}
                                    ${classes.textMainDimmedItalic}
                                `}
                            >
                                @{user.username}
                            </span>
                            <fetcher.Form
                                method="post"
                                action="/logout"
                                className={styles.logoutForm}
                            >
                                <button
                                    title="Log out of this account"
                                    className={`
                                    ${styles.logout}
                                    ${classes.gridCenter}
                                `}
                                >
                                    <span
                                        className={`
                                        material-symbols-rounded
                                        ${styles.icon}
                                    `}
                                    >
                                        door_open
                                    </span>
                                </button>
                            </fetcher.Form>
                        </div>
                    ) : (
                        emptyDivHtml
                    )}
                </motion.nav>
            ) : (
                <motion.nav
                    key="navbar:closed"
                    initial={motionInitial}
                    animate={motionAnimate}
                    exit={motionExit}
                    className={`
                        ${styles.navbar}
                        ${classes.flexColumn}
                        ${styles.closed}
                    `}
                >
                    {logoHtml}
                    {separatorHtml}
                    {linksHtml}
                    {user ? (
                        <>
                            <button
                                title="Open navbar"
                                onClick={() => setIsOpen(true)}
                            >
                                {ppfHtml}
                            </button>
                        </>
                    ) : null}
                </motion.nav>
            )}
        </AnimatePresence>
    );
}
