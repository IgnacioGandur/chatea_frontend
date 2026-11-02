import classes from "~/css/classes.module.css";
import styles from "./Groups.module.css";

export default function SuspenseGroup() {
    return (
        <div
            className={`
                ${styles.group}
                ${styles.suspense}
                ${classes.flexColumn}
            `}
        >
            <div
                className={`
                    ${styles.ppf}
                    ${classes.profilePictureRound}
                    ${classes.pictureBig}
                    ${classes.suspenseBackgroundAnimation}
                `}
            ></div>
            <div
                className={`
                ${styles.groupTitle}
                ${classes.suspenseBackgroundAnimation}
                `}
            >
                This is the group title
            </div>
            <div
                className={`
                ${styles.description}
                ${classes.smallText}
                ${classes.suspenseBackgroundAnimation}
            `}
            >
                Lorem ipsum dolor sit, amet consectetur adipisicing elit. Ea ad
                blanditiis officiis eveniet saepe quam possimus ullam,
                molestias.
            </div>
            <div
                className={`
                    ${styles.participants}
                    ${classes.flexColumn}
                `}
            >
                <div
                    className={`
                        ${styles.headerText}
                        ${classes.flexRowStartCenter}
                    `}
                >
                    <span
                        className={`
                            material-symbols-rounded
                            ${styles.icon}
                        `}
                    >
                        person_raised_hand
                    </span>
                    <div
                        className={`
                        ${styles.text}
                        ${classes.flexRowStartCenter}
                        `}
                    >
                        <span
                            className={`
                            ${styles.count}
                            ${classes.suspenseBackgroundAnimation}
                            `}
                        >
                            10
                        </span>
                        <span>Participants</span>
                    </div>
                </div>
                <ul className={styles.participantsContainer}>
                    {Array.from({ length: 5 }).map((_, i) => {
                        return (
                            <div
                                style={{
                                    transform: `translateX(-${16 * i}px)`,
                                }}
                                key={i}
                                className={styles.participant}
                            >
                                <div
                                    className={`
                                        ${styles.participantPpf}
                                        ${classes.profilePictureRound}
                                        ${classes.pictureSmall}
                                        ${classes.suspenseBackgroundAnimation}
                                    `}
                                ></div>
                            </div>
                        );
                    })}
                </ul>
            </div>
            <div
                className={`
                    ${styles.groupOwner}
                    ${classes.flexColumn}
                `}
            >
                <div
                    className={`
                        ${styles.headerText}
                        ${classes.flexRowStartCenter}
                    `}
                >
                    <span
                        className={`
                            material-symbols-rounded
                            ${styles.icon}
                        `}
                    >
                        crown
                    </span>
                    <span className={styles.text}>Group Owner</span>
                </div>
                <div className={styles.ownerInfo}>
                    <div
                        className={`
                            ${styles.ppf}
                            ${classes.profilePictureRound}
                            ${classes.correctImage}
                            ${classes.pictureMedium}
                            ${classes.suspenseBackgroundAnimation}
                        `}
                    ></div>
                    <div
                        className={`
                            ${styles.name}
                            ${classes.suspenseBackgroundAnimation}
                        `}
                    >
                        Group owner name
                    </div>
                    <div
                        className={`
                            ${styles.username}
                            ${classes.suspenseBackgroundAnimation}
                        `}
                    >
                        @owner.username
                    </div>
                </div>
            </div>
            <div
                className={`
                ${styles.creationDate}
                ${classes.textSmallSecondary}
                ${classes.suspenseBackgroundAnimation}
                `}
            >
                Created January 01, 2001 at 00:01 AM
            </div>
        </div>
    );
}
