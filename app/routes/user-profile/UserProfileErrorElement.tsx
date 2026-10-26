import type { MaterialSymbol } from "material-symbols";
import { useParams, useRevalidator } from "react-router";
import classes from "~/css/classes.module.css";
import styles from "./UserProfile.module.css";
import { NavLink } from "react-router";

type UserProfileErrorElementProps = {
    errorType: "error-boundary" | "not-found" | "await-error";
};

export default function UserProfileErrorElement({
    errorType,
}: UserProfileErrorElementProps) {
    const { username } = useParams();
    const { revalidate, state } = useRevalidator();

    const isRetrying = errorType === "await-error" && state === "loading";

    const content = {
        "not-found": {
            title: `404 Not Found`,
            icon: "search_off",
            main: `We were not able to find a user with a username: "${username}".`,
            secondary: "Double-check it for typos and try again.",
        },
        "await-error": {
            title: "500 Server Error",
            icon: isRetrying ? "cycle" : "power_off",
            main: "Seems like we are having a server/database problem at the moment.",
            secondary: "Try again in a little bit...",
        },
        "error-boundary": {
            title: "500 Server Error",
            icon: "heart_broken",
            main: "The app crashed when trying to get this user's profile.",
            secondary:
                "There's nothing you can do in this case, maybe try again later...",
        },
    } satisfies Record<
        typeof errorType,
        {
            title: string;
            icon: MaterialSymbol;
            main: string;
            secondary: string;
        }
    >;

    const { title, icon, main, secondary } = content[errorType];

    const links = [
        {
            to: "/",
            text: "Go back to home",
            icon: "home",
        },
        {
            to: "/users",
            text: "Back the users page",
            icon: "group",
        },
    ];

    const pageTitle = `${title} | Chateá!`;

    return (
        <main
            className={`
                    ${styles.errorElement}
                    ${classes.flexColumnAlignCenterJustifyCenter}
                `}
        >
            <title>{pageTitle}</title>
            <span
                aria-hidden
                className={`
                    ${styles.mainTitle}
                    `}
            >
                {isRetrying ? "Trying again..." : "Oooops!"}
            </span>
            <span
                aria-hidden
                className={`
                        material-symbols-rounded
                        ${styles.mainIcon}
                        ${classes.textWithMainColorsGradient}
                        ${isRetrying ? classes.spinIcon : ""}
                    `}
            >
                {icon}
            </span>
            <div
                className={`
                        ${styles.wrapper}
                        ${classes.flexColumn}
                    `}
            >
                <header
                    className={`
                        ${styles.header}
                        ${classes.flexColumn}
                    `}
                >
                    <h1 className={styles.title}>{title}</h1>
                    <p
                        className={`
                                ${styles.para}
                                ${classes.flexColumn}
                            `}
                    >
                        <span className={styles.main}>{main}</span>
                        <span>{secondary}</span>
                    </p>
                </header>
                <section
                    className={`
                        ${styles.linksSection}
                        ${classes.flexColumn}
                    `}
                >
                    <header
                        className={`
                        ${styles.header}
                        ${classes.flexRowStartCenter}
                        `}
                    >
                        <span
                            aria-hidden
                            className={`
                                material-symbols-rounded
                                ${classes.icon}
                            `}
                        >
                            help
                        </span>
                        <div
                            className={`
                                ${styles.separator}
                                ${classes.ballSeparator}
                            `}
                        ></div>
                        <h2 className={styles.title}>
                            What would you like to do?
                        </h2>
                    </header>
                    <div
                        className={`
                            ${styles.links}
                            ${classes.flexRow}
                        `}
                    >
                        {links.map((l) => {
                            return (
                                <NavLink
                                    className={`
                                        ${styles.link}
                                        ${classes.flexRowCenter}
                                        ${classes.outline1}
                                    `}
                                    key={l.text}
                                    to={l.to}
                                >
                                    <span
                                        aria-hidden
                                        className={`
                                                material-symbols-rounded
                                                ${styles.icon}
                                            `}
                                    >
                                        {l.icon}
                                    </span>
                                    <span
                                        aria-hidden
                                        className={styles.separator}
                                    ></span>
                                    <span className={styles.text}>
                                        {l.text}
                                    </span>
                                </NavLink>
                            );
                        })}
                        {errorType === "await-error" ? (
                            <button
                                type="button"
                                disabled={isRetrying}
                                className={`
                                            ${styles.link}
                                            ${classes.flexRowCenter}
                                            ${classes.outline1}
                                        `}
                                onClick={() => revalidate()}
                            >
                                <span
                                    aria-hidden
                                    className={`
                                            material-symbols-rounded
                                            ${styles.icon}
                                            `}
                                >
                                    refresh
                                </span>
                                <div className={styles.separator}></div>
                                <span className={styles.text}>Try again</span>
                            </button>
                        ) : null}
                    </div>
                </section>
            </div>
        </main>
    );
}
