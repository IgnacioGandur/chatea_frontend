import type { Stat } from "./UserProfile.tsx";
import logo from "~/../public/images/icon_light.svg";
import classes from "~/css/classes.module.css";
import styles from "./UserProfile.module.css";

interface SkeletonProps {}

export default function Skeleton({}: SkeletonProps) {
    const stats: Stat[] = [
        {
            name: "joined on",
            count: "January 01, 2001",
            icon: "calendar_month",
        },
        {
            name: "friendships",
            count: 0,
            icon: "handshake",
        },
        {
            name: "sent messages",
            count: 0,
            icon: "comic_bubble",
        },
        {
            name: "owned groups",
            count: 0,
            icon: "crown",
        },
        {
            name: "participant in groups",
            count: 0,
            icon: "person_raised_hand",
        },
    ];

    const pageTitle = "Loading user profile | Chateá!";

    return (
        <main
            className={`
                ${styles.skeleton}
                ${classes.flexColumn}
            `}
        >
            <title>{pageTitle}</title>
            <div
                className={`
                    ${styles.banner}
                    ${classes.linearGradientToBottomMainColors}
                    ${classes.flexRowAlignCenterJustifyCenter}
                `}
            >
                <img
                    className={styles.logo}
                    src={logo}
                    alt="Website logo"
                />
                <h2 className={styles.title}>Chateá!</h2>
                <div
                    className={`
                        ${styles.ppf}
                        ${classes.correctImage}
                        ${classes.profilePictureRound}
                        ${classes.pictureBig}
                        ${classes.suspenseBackgroundAnimation}
                    `}
                ></div>
            </div>
            <div
                className={`
                    ${styles.nameAndFriendship}
                    ${classes.flexRowAlignCenterJustifyBetween}
                `}
            >
                <div
                    className={`
                    ${styles.names}
                    ${classes.flexColumn}
                    `}
                >
                    <div
                        className={`
                            ${styles.name}
                            ${classes.suspenseBackgroundAnimation}
                        `}
                    ></div>
                    <div
                        className={`
                            ${styles.username}
                            ${classes.suspenseBackgroundAnimation}
                        `}
                    ></div>
                </div>
                <div
                    className={`
                    ${styles.friendshipForm}
                    ${classes.suspenseBackgroundAnimation}
                    `}
                ></div>
            </div>
            <section
                className={`
                    ${styles.stats}
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
                            ${styles.icon}
                            ${classes.textWithMainColorsGradient}
                        `}
                    >
                        query_stats
                    </span>
                    <div
                        aria-hidden
                        className={`
                            ${styles.separator}
                            ${classes.ballSeparator}
                        `}
                    ></div>
                    <h2
                        className={`
                            ${styles.text}
                        `}
                    >
                        User stats
                    </h2>
                </header>
                <ul
                    className={`
                        ${styles.statsContainer}
                        ${classes.flexRow}
                    `}
                >
                    {stats.map((s, i) => {
                        return (
                            <li
                                key={i}
                                className={styles.stat}
                            >
                                <header
                                    className={`
                                        ${styles.statHeader}
                                        ${classes.flexRowStartCenter}
                                    `}
                                >
                                    <span
                                        aria-hidden
                                        className={`
                                            material-symbols-rounded
                                            ${styles.icon}
                                            ${classes.textWithMainColorsGradient}
                                        `}
                                    >
                                        {s.icon}
                                    </span>
                                    <div
                                        aria-hidden
                                        className={`
                                            ${classes.ballSeparator}
                                        `}
                                    ></div>
                                    <h3 className={styles.title}>{s.name}</h3>
                                </header>
                                <div
                                    className={`
                                        ${styles.countWrapper}
                                    `}
                                >
                                    <span
                                        className={`
                                            ${styles.count}
                                            ${classes.suspenseBackgroundAnimation}
                                        `}
                                    >
                                        {s.count}
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </section>
            <footer
                className={`
                    ${styles.footer}
                    ${classes.flexRowCenter}
                    ${classes.textSlimCenterSecondaryFont}
                `}
            >
                <p>Chateá!</p>
            </footer>
        </main>
    );
}
