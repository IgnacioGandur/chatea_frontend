import { format } from "date-fns";
import type { GroupsPage } from "../../db/groups.types.ts";

import { useState, useRef, useEffect } from "react";
import PillButton from "~/components/pill-button/PillButton";
import { useFetcherToast } from "~/hooks/useFetcherToast";
import Popover from "~/components/popover/Popover";
import classes from "~/css/classes.module.css";
import RoundInfoTooltip from "~/components/round-info-tooltip/RoundInfoTooltip";
import styles from "./Groups.module.css";
import { useFetcher } from "react-router";
import useRootData from "~/hooks/useRootData";
import SuspenseGroup from "./SuspenseGroup";

interface GroupsGridProps {
    initialPage: GroupsPage;
    searchTitle?: string;
    filter?: string;
}

export default function GroupsGrid({
    initialPage,
    searchTitle,
    filter,
}: GroupsGridProps) {
    const fetcher = useFetcher<GroupsPage>();

    const [groups, setGroups] = useState(initialPage.groups);
    const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);

    const containerRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const setToastData = useFetcherToast(fetcher);
    const rootData = useRootData();
    const user = rootData?.user;

    // When the data of more groups arrives, attach it to the groups array.
    useEffect(() => {
        if (!fetcher.data) return;

        setGroups((prev) => [...prev, ...fetcher.data!.groups]);

        setNextCursor(fetcher.data!.nextCursor);
    }, [fetcher.data]);

    // When the sentinel scrolls into view, request more groups.
    useEffect(() => {
        const sentinel = sentinelRef.current;

        if (!sentinel || nextCursor === null) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && fetcher.state === "idle") {
                    const params = new URLSearchParams({
                        cursor: String(nextCursor),
                    });

                    if (searchTitle) params.set("title", searchTitle);
                    if (filter) params.set("filter", filter);

                    fetcher.load(`/api/groups?${params}`);
                }
            },
            {
                root: containerRef.current,
                rootMargin: "300px",
            },
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [nextCursor, fetcher.state]);

    const isLoadingMoreGroups = fetcher.state === "loading";

    return (
        <div
            ref={containerRef}
            className={styles.groupsContainer}
        >
            {groups.map((group, i) => {
                const isYourGroup = user?.id === group.ownerId;

                // If logged user is participant and not owner of the group.
                const isParticipant = group.participants.find((participant) => {
                    return (
                        participant.userId === user?.id &&
                        participant.role !== "OWNER"
                    );
                });

                const currentIntent = fetcher.formData?.get("intent") as
                    "join-group" | "leave-group";

                const isIdle = fetcher.state === "idle";
                const currentGroupId = Number(
                    fetcher.formData?.get("conversationId"),
                );

                // If the user is current joining or leaving this group.
                const isInteractingWithThisGroup =
                    !isIdle &&
                    (currentIntent === "join-group" ||
                        (currentIntent === "leave-group" &&
                            currentGroupId === group.id));

                const groupOwner = group.participants.find(
                    (p) => p.role === "OWNER",
                )!.user;

                const groupOwnerName = `${groupOwner.firstName} ${groupOwner.lastName}`;

                return (
                    <article
                        key={group.id}
                        className={`${styles.group} ${classes.flexColumn}`}
                    >
                        {isYourGroup ? (
                            <RoundInfoTooltip
                                className={styles.yourGroup}
                                icon="crown"
                                tooltipMessage="Your group"
                            />
                        ) : null}
                        {isYourGroup ? null : isInteractingWithThisGroup ? (
                            <div
                                className={`
                                    ${classes.roundDefaultButton}
                                    ${styles.loadingButton}
                                `}
                            >
                                <span
                                    className={`${classes.spinIcon} material-symbols-rounded`}
                                >
                                    progress_activity
                                </span>
                            </div>
                        ) : isParticipant ? (
                            <Popover
                                anchorName={`--leave-group-${i}`}
                                popoverTarget={`leave-group-${i}`}
                                buttonContent={
                                    <span
                                        className={`${classes.defaultIcon} material-symbols-rounded`}
                                    >
                                        waving_hand
                                    </span>
                                }
                                popoverContainerClass={styles.leaveGroupButton}
                                anchorButtonClass={classes.roundDefaultButton}
                                anchorButtonAriaLabel={`Leave group: "${group.title}".`}
                                anchorButtonTitle="Leave group"
                                altPopoverClass={styles.leaveGroupPopover}
                            >
                                <fetcher.Form
                                    onSubmit={() =>
                                        setToastData({
                                            loadingMessage: "Leaving group...",
                                            failMessage:
                                                "Error while leaving group.",
                                            toastId: "leave-group",
                                        })
                                    }
                                    className={`
                                        ${styles.leaveGroupForm}
                                        ${classes.flexColumn}
                                        ${classes.floatingForm}
                                    `}
                                    method="post"
                                >
                                    <input
                                        type="hidden"
                                        name="intent"
                                        value="leave-group"
                                    />
                                    <h2 className={`${classes.titleSmall}`}>
                                        Are you sure you want to leave this
                                        group?
                                    </h2>
                                    <div className={classes.separator}></div>
                                    <PillButton
                                        buttonAriaLabel={`Confirm leaving ${group.title}.`}
                                        buttonText="Confirm"
                                        buttonTitle="Confirm leaving group"
                                        includeEmptySpace
                                        includeIcon
                                        type="submit"
                                        name="conversationId"
                                        icon="check"
                                        value={group.id}
                                    />
                                </fetcher.Form>
                            </Popover>
                        ) : (
                            <Popover
                                anchorName={`--join-group-${i}`}
                                popoverTarget={`join-group-${i}`}
                                buttonContent={
                                    <span
                                        className={`
                                            material-symbols-rounded
                                            ${classes.defaultIcon}
                                        `}
                                    >
                                        meeting_room
                                    </span>
                                }
                                popoverContainerClass={styles.joinGroupButton}
                                anchorButtonClass={classes.roundDefaultButton}
                                anchorButtonAriaLabel={`Join group: "${group.title}".`}
                                anchorButtonTitle="Join group"
                                altPopoverClass={styles.joinGroupPopover}
                            >
                                <fetcher.Form
                                    method="post"
                                    onSubmit={() =>
                                        setToastData({
                                            loadingMessage: "Joining group...",
                                            failMessage:
                                                "Error while joining group.",
                                            toastId: "join-group",
                                        })
                                    }
                                    className={`
                                        ${styles.joinGroupForm}
                                        ${classes.flexColumn}
                                        ${classes.floatingForm}
                                    `}
                                >
                                    <input
                                        type="hidden"
                                        name="intent"
                                        value="join-group"
                                    />
                                    <h2 className={`${classes.titleSmall}`}>
                                        Confirm joining group
                                    </h2>
                                    <div className={classes.separator}></div>
                                    <PillButton
                                        buttonAriaLabel={`Confirm joining ${group.title}.`}
                                        buttonText="Confirm"
                                        buttonTitle="Confirm joining group"
                                        includeEmptySpace
                                        includeIcon
                                        type="submit"
                                        name="conversationId"
                                        icon="check"
                                        value={group.id}
                                    />
                                </fetcher.Form>
                            </Popover>
                        )}
                        <img
                            src={group.profilePicture ?? undefined}
                            alt={group.title ?? "Group profile"}
                            className={`${styles.ppf} ${classes.profilePictureRound} ${classes.pictureBig}`}
                        />
                        <h2 className={styles.groupTitle}>{group.title}</h2>
                        <p
                            className={`${classes.smallText} ${styles.description}`}
                        >
                            {group.description}
                        </p>
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
                                <span className={styles.text}>
                                    {group._count.participants}{" "}
                                    {group._count.participants === 1
                                        ? "Participant"
                                        : "Participants"}
                                </span>
                            </div>
                            <ul className={styles.participantsContainer}>
                                {group.participants.map((participant, i) => {
                                    const name =
                                        participant.user.firstName +
                                        " " +
                                        participant.user.lastName;

                                    return i === 9 &&
                                        group._count.participants > 10 ? (
                                        <div
                                            className={`
                                                ${classes.pictureSmall}
                                                ${classes.profilePictureRound}
                                                ${styles.moreParticipants}
                                            `}
                                        >
                                            <span
                                                className={`
                                                    ${styles.icon}
                                                    material-symbols-rounded
                                                `}
                                            >
                                                add
                                            </span>
                                        </div>
                                    ) : (
                                        <li
                                            style={{
                                                transform: `translateX(-${16 * i}px)`,
                                            }}
                                            key={participant.userId}
                                            className={styles.participant}
                                        >
                                            <img
                                                className={`
                                                    ${styles.participantPpf}
                                                    ${classes.profilePictureRound}
                                                    ${classes.pictureSmall}
                                                `}
                                                src={
                                                    participant.user
                                                        .profilePictureUrl
                                                }
                                                alt={name}
                                            />
                                        </li>
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
                                <img
                                    src={groupOwner.profilePictureUrl}
                                    alt={groupOwnerName}
                                    className={`
                                        ${styles.ppf}
                                        ${classes.profilePictureRound}
                                        ${classes.correctImage}
                                        ${classes.pictureMedium}
                                    `}
                                />
                                <h3 className={styles.name}>
                                    {groupOwnerName}
                                </h3>
                                <span className={styles.username}>
                                    @{groupOwner.username}
                                </span>
                            </div>
                        </div>
                        <p
                            className={`
                            ${styles.creationDate}
                            ${classes.textSmallSecondary}
                            `}
                        >
                            Created{" "}
                            {format(
                                group.createdAt,
                                "MMMM do, yyyy 'at' hh:mm aa",
                            )}
                        </p>
                    </article>
                );
            })}
            {isLoadingMoreGroups
                ? Array.from({ length: 10 }).map((_, i) => {
                      return <SuspenseGroup key={i} />;
                  })
                : null}
            {nextCursor !== null ? (
                <div
                    ref={sentinelRef}
                    className={styles.sentinel}
                ></div>
            ) : null}
        </div>
    );
}
