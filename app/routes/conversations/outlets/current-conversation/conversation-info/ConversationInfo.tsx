import type { GetConversationByIdMessagesInclude } from "~/db/conversation.types";
import styles from "./ConversationInfo.module.css";
import classes from "~/css/classes.module.css";
import RoundInfoTooltip from "~/components/round-info-tooltip/RoundInfoTooltip";
import {
    NavLink,
    useRouteLoaderData,
    type FetcherWithComponents,
} from "react-router";
import InvokerModal from "~/components/invoker-modal/InvokerModal";
import { customFormatDate } from "~/utils/formatDate";
import EditFieldButton from "~/components/edit-field-button/EditFieldButton";
import AltPopover from "~/components/alt-popover/AltPopover";
import { useFetcherToast } from "~/hooks/useFetcherToast";

interface ConversationInfoProps {
    className?: string;
    fetcher: FetcherWithComponents<any>;
    conversation: GetConversationByIdMessagesInclude;
}

export default function ConversationInfo({
    className,
    fetcher,
    conversation,
}: ConversationInfoProps) {
    const { user: loggedUser } = useRouteLoaderData("root");
    const groupOwner = conversation?.participants.find((p) => {
        return p.role === "OWNER";
    });
    const participants = conversation.participants;

    const isGroup = conversation.isGroup;
    const userB = participants.find((p) => p.userId !== loggedUser.id);

    const ppf = isGroup
        ? conversation.profilePicture
        : userB?.user.profilePictureUrl;
    const userBName = `${userB?.user.firstName} ${userB?.user.lastName}`;

    const title = isGroup ? conversation.title : userBName;
    const description = conversation.description;

    const loggedUserAsParticipant = participants.find(
        (p) => p.userId === loggedUser.id,
    );

    const loggedUserIsGroupOwner = loggedUserAsParticipant?.role === "OWNER";
    const loggedUserIsGroupAdmin = loggedUserAsParticipant?.role === "ADMIN";

    const setToastData = useFetcherToast(fetcher);

    return (
        <aside
            className={`
                ${className ? className : ""}
                ${styles.conversationInfo}
                ${classes.flexColumnStartCenter}
            `}
        >
            <header
                className={`${classes.flexRowStartCenter} ${styles.header}`}
            >
                <span
                    className={`${classes.iconWithGradientColors} ${styles.icon} material-symbols-rounded`}
                >
                    {isGroup ? "groups_3" : "domino_mask"}
                </span>
                <div className={`${classes.ballSeparator}`}></div>
                <h2 className={classes.titleSmallMainFont}>
                    {isGroup ? "Group conversation" : "Private conversation"}
                </h2>
            </header>
            {loggedUserIsGroupOwner ? (
                <RoundInfoTooltip
                    tooltipMessage="You group"
                    icon="crown"
                />
            ) : null}
            <div className={styles.ppfWrapper}>
                <img
                    className={`${classes.profilePictureRound} ${classes.pictureBig}`}
                    src={ppf ?? undefined}
                    alt={title ?? undefined}
                />
                {loggedUserIsGroupOwner ? (
                    <EditFieldButton
                        anchorButtonClass={styles.editButton}
                        buttonIcon="background_replace"
                        labelText="Edit group's profile picture URL"
                        fieldId="edit-group-ppf"
                        inputIcon="edit"
                        placeholder="https://placehold.co/600x400.png"
                        inputName="profilePictureUrl"
                        intentValue="edit-group"
                        fetcher={fetcher}
                    />
                ) : null}
            </div>
            <div
                className={`${styles.titleWrapper} ${classes.flexRowStartCenter}`}
            >
                {loggedUserIsGroupOwner ? (
                    <EditFieldButton
                        fieldId="groupTitle"
                        labelText="Edit group's title."
                        inputIcon="edit"
                        placeholder="New group name"
                        inputName="title"
                        intentValue="edit-group"
                        fetcher={fetcher}
                    />
                ) : null}
                <h2 className={styles.infoTitle}>{title}</h2>
            </div>
            {description ? (
                <div className={styles.wrapper}>
                    <div
                        className={`${styles.titleWrapper} ${classes.flexRowStartCenter}`}
                    >
                        {loggedUserIsGroupOwner ? (
                            <EditFieldButton
                                fieldId="group-description"
                                labelText="Edit group's description."
                                inputIcon="edit"
                                placeholder="This is group is about programming!"
                                inputName="description"
                                intentValue="edit-group"
                                fetcher={fetcher}
                            />
                        ) : null}
                        <h4 className={classes.smallText}>Description</h4>
                    </div>
                    <p
                        className={`
                    ${styles.description}
                    ${classes.textMainDimmedItalic}
                    `}
                    >
                        {description}
                    </p>
                </div>
            ) : null}
            {groupOwner ? (
                <NavLink
                    to={`/users/${groupOwner.user.username}`}
                    className={styles.wrapper}
                >
                    <h4 className={classes.smallText}>Group owner</h4>
                    <div className={styles.groupOwner}>
                        <img
                            className={`${classes.profilePictureRound} ${classes.pictureMedium}`}
                            src={groupOwner.user.profilePictureUrl}
                            alt={`${groupOwner.user.firstName} ${groupOwner.user.lastName}`}
                        />
                        <h3
                            className={classes.titleSmallMainFont}
                        >{`${groupOwner.user.firstName} ${groupOwner.user.lastName}`}</h3>
                    </div>
                </NavLink>
            ) : null}
            {isGroup ? (
                <button
                    aria-label="Show participants list."
                    title="Show participants."
                    className={`${styles.wrapper} ${styles.showParticipantsModalButton} ${classes.noBorderNoOutline}`}
                    commandfor="participants-modal"
                    command="show-modal"
                >
                    <h4 className={classes.smallText}>Participants</h4>
                    <ul className={styles.participants}>
                        {participants.map((p, i) => {
                            const name =
                                p.user.firstName + " " + p.user.lastName;
                            return (
                                <li
                                    key={p.userId}
                                    style={{
                                        transform: `translateX(-${12 * i}px)`,
                                    }}
                                    className={styles.participant}
                                >
                                    <img
                                        className={`${classes.profilePictureRound} ${classes.pictureSmall} ${styles.participantPpf}`}
                                        src={p.user.profilePictureUrl}
                                        alt={name}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                </button>
            ) : null}
            <p
                className={`
                    ${styles.creationDate}
                    ${classes.textMainDimmedItalic}
                    ${classes.textAlignCenter}
                `}
            >
                <span className="date">
                    Created on {customFormatDate(conversation.createdAt)}
                </span>
            </p>
            <InvokerModal
                id="participants-modal"
                className={styles.participantsModal}
            >
                <header
                    className={`${classes.flexRowStartCenter} ${styles.modalHeader}`}
                >
                    <span
                        className={`${classes.iconWithGradientColors} ${styles.icon} material-symbols-rounded`}
                    >
                        diversity_2
                    </span>
                    <div
                        className={`${classes.ballSeparator} ${classes.ballSeparator}`}
                    ></div>
                    <h2 className={classes.titleMedium}>Participants list</h2>
                </header>
                <ul
                    className={`${styles.modalParticipantsList} ${classes.flexColumn}`}
                >
                    {participants.map((participant, i) => {
                        const {
                            role,
                            userId,
                            joinedAt,
                            user: {
                                profilePictureUrl,
                                firstName,
                                lastName,
                                username,
                            },
                        } = participant;

                        const name = `${firstName} ${lastName}`;

                        const joinDate = customFormatDate(joinedAt);

                        const isLoggedUser = userId === loggedUser!.id;

                        const isOwner = role === "OWNER";
                        const isAdmin = role === "ADMIN";
                        const isRegularParticipant = role === "USER";

                        const adminControls = (
                            <fetcher.Form
                                onSubmit={() =>
                                    setToastData({
                                        loadingMessage: "Removing user...",
                                        failMessage: "Unable to remove user.",
                                        toastId: "remove-user",
                                    })
                                }
                                method="post"
                            >
                                <input
                                    type="hidden"
                                    name="intent"
                                    value="remove-user"
                                />
                                <input
                                    type="hidden"
                                    name="participantId"
                                    value={participant.userId}
                                />
                                <button>remove user</button>
                            </fetcher.Form>
                        );

                        const ownerControls = (
                            <>
                                {adminControls}
                                <fetcher.Form
                                    onSubmit={() =>
                                        setToastData({
                                            failMessage:
                                                "Unable to update participant role.",
                                            loadingMessage:
                                                "Updating participant role...",
                                            toastId: "update-p-role",
                                        })
                                    }
                                    method="post"
                                >
                                    <input
                                        type="hidden"
                                        name="intent"
                                        value="update-participant-role"
                                    />
                                    <input
                                        type="hidden"
                                        name="participantId"
                                        value={participant.userId}
                                    />
                                    {isAdmin ? (
                                        <button
                                            name="role"
                                            value="USER"
                                        >
                                            remove adminship
                                        </button>
                                    ) : (
                                        <button
                                            name="role"
                                            value="ADMIN"
                                        >
                                            make admin
                                        </button>
                                    )}
                                </fetcher.Form>
                            </>
                        );

                        return (
                            <li
                                key={i}
                                className={`${styles.participant} ${classes.flexRowStartCenter}`}
                            >
                                <img
                                    className={`${classes.profilePictureRound} ${classes.pictureMedium} ${styles.ppf}`}
                                    src={profilePictureUrl}
                                    alt={name}
                                />
                                <h4
                                    className={`${classes.titleSmallMainFont} ${styles.name}`}
                                >
                                    {name}
                                </h4>
                                <p
                                    className={`${classes.textMainDimmedItalic} ${styles.username}`}
                                >
                                    @{username}
                                </p>
                                {isLoggedUser ? (
                                    <p
                                        className={`${classes.textMainDimmedItalic} ${styles.you}`}
                                    >
                                        (You)
                                    </p>
                                ) : null}
                                <RoundInfoTooltip
                                    className={`${styles.roleIcon}`}
                                    buttonClassName={styles.altButtonStyle}
                                    iconClassName={`${classes.iconWithGradientColors}`}
                                    icon={
                                        isOwner
                                            ? "crown"
                                            : isAdmin
                                              ? "shield"
                                              : "person"
                                    }
                                    tooltipMessage={
                                        isOwner
                                            ? "Group owner"
                                            : isAdmin
                                              ? "Group admin"
                                              : "User"
                                    }
                                />
                                {isLoggedUser ? null : loggedUserIsGroupOwner ||
                                  (loggedUserIsGroupAdmin &&
                                      isRegularParticipant) ? (
                                    <AltPopover
                                        popoverPosition="left"
                                        className={styles.options}
                                        buttonClassName={
                                            classes.roundDefaultButton
                                        }
                                    >
                                        {loggedUserIsGroupOwner
                                            ? ownerControls
                                            : loggedUserIsGroupAdmin &&
                                                isRegularParticipant
                                              ? adminControls
                                              : null}
                                    </AltPopover>
                                ) : null}
                                <p
                                    className={`${styles.joinDate} ${classes.smallText}`}
                                >
                                    Joined on {joinDate}
                                </p>
                            </li>
                        );
                    })}
                </ul>
            </InvokerModal>
        </aside>
    );
}
