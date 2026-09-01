// CSS
import styles from "./Groups.module.css";
import classes from "~/css/classes.module.css";

// Packages
import * as z from "zod";
import { Suspense } from "react";
import {
    Await,
    data,
    redirect,
    useFetcher,
    useRouteLoaderData,
} from "react-router";

// Types
import type { Route } from "./+types/Groups";
import type { $ZodIssue } from "zod/v4/core";

// Components
import PageHeader from "~/components/page-header/PageHeader";
import CustomPageLoader from "~/components/custom-page-loader/CustomPageLoader";
import LoaderErrorElement from "~/components/loader-error-element/LoaderErrorElement";
import EmptySection from "~/components/empty-section/EmptySection";
import Popover from "~/components/popover/Popover";
import CustomInput from "~/components/custom-input/CustomInput";
import PillButton from "~/components/pill-button/PillButton";
import ValidationErrors from "~/components/validation-errors/ValidationErrors";

// DB
import groupsModel from "~/db/groups.model";

// Session
import { getSession } from "~/session.server";

// Validators
import { validateGroupCreation } from "~/validators/validateGroupCreation";

// Utiliites
import { checkForValidationErrors } from "~/utils/checkForValidationErrors";

// Hooks
import { useFetcherToast } from "~/hooks/useFetcherToast";
import type { RootLoaderData } from "~/types/RootLoaderData";
import RoundInfoTooltip from "~/components/round-info-tooltip/RoundInfoTooltip";
import validateLeavingOrJoiningGroup from "~/validators/validateLeavingOrJoiningGroup";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Groups | Chateá!" },
        {
            name: "description",
            content:
                "Find and join groups to chat with people who share interests with you in Chateá!",
        },
    ];
}

export async function loader({}: Route.LoaderArgs) {
    const groupsPromise = groupsModel.getAll();

    return { groupsPromise };
}

const validIntents = ["create-group", "join-group", "leave-group"] as const;

type ValidIntent = (typeof validIntents)[number];

type FormValues = {
    intent: ValidIntent;
    title: string;
    description: string;
    conversationId: string;
};

export async function action({ request }: Route.ActionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (!userId) {
        return data("Unauthorized.", {
            status: 401,
            statusText: "This route is for logged users only.",
        });
    }

    await new Promise((r) => setTimeout(r, 3000));

    const formData = await request.formData();
    const values = Object.fromEntries(formData) as FormValues;
    const validationErrorMessage =
        "Unable to create group, please check the following: ";

    const intentValidation = z
        .object({
            intent: z.enum(validIntents, {
                error: (issue) =>
                    `Invlid intent value. Received: '${issue.input}'.`,
            }),
        })
        .safeParse({ intent: values.intent });

    if (!intentValidation.success) {
        return {
            success: false,
            message: validationErrorMessage,
            errors: intentValidation.error.issues,
        };
    }

    switch (values.intent) {
        case "create-group": {
            const validation = await validateGroupCreation.safeParseAsync({
                title: values.title,
                description: values.description,
            });

            if (!validation.success) {
                return {
                    success: false,
                    message: validationErrorMessage,
                    errors: validation.error.issues,
                };
            }

            await groupsModel.create(
                validation.data.title,
                validation.data.description,
                userId,
            );

            return {
                success: true,
                message: "Group created!",
            };
        }

        case "join-group": {
            const conversationId = Number(values.conversationId);

            const validation = await validateLeavingOrJoiningGroup(
                conversationId,
                Number(userId),
                false,
            );

            if (!validation.success) {
                return {
                    success: false,
                    message: "Not able to join group.",
                    errors: validation.error.issues,
                };
            }

            await groupsModel.addParticipantToGroup(
                conversationId,
                Number(userId),
            );

            return redirect(`/conversations/${validation.data.conversationId}`);
        }

        case "leave-group": {
            const conversationId = Number(values.conversationId);

            const validation = await validateLeavingOrJoiningGroup(
                conversationId,
                Number(userId),
                true,
            );

            if (!validation.success) {
                return {
                    success: false,
                    message: "Error while trying to leave group:",
                    errors: validation.error.issues,
                };
            }

            await groupsModel.leaveGroup(conversationId, Number(userId));

            return {
                success: true,
                message: "You left the group!",
            };
        }
    }
}

interface ActionResponse {
    success: boolean;
    message: string;
    errors?: $ZodIssue[];
}

export default function Groups({ loaderData }: Route.ComponentProps) {
    const fetcher = useFetcher<ActionResponse>();
    const { groupsPromise } = loaderData;

    const { user } = useRouteLoaderData("root") as RootLoaderData;

    // Validation errors
    const hasValidationErrors = checkForValidationErrors(fetcher);

    const setToastData = useFetcherToast(fetcher);

    return (
        <main className={styles.groups}>
            <PageHeader
                icon="groups_3"
                title="Groups"
            />
            {hasValidationErrors ? (
                <ValidationErrors
                    title={fetcher.data!.message}
                    errors={fetcher.data!.errors || []}
                />
            ) : null}
            <div className={`${styles.groupButtons} ${classes.flexRowCenter}`}>
                <Popover
                    anchorName="--create-group"
                    popoverTarget="create-group"
                    anchorButtonClass={classes.roundDefaultButton}
                    anchorButtonTitle="Create a new group"
                    buttonContent={
                        <span
                            className={`material-symbols-rounded ${classes.defaultIcon}`}
                        >
                            group_add
                        </span>
                    }
                    anchorButtonAriaLabel="Create a new group"
                >
                    <fetcher.Form
                        className={`${classes.floatingForm} ${classes.flexColumnCenter}`}
                        onSubmit={() =>
                            setToastData({
                                failMessage: "Group creation failed.",
                                loadingMessage: "Creating group...",
                                toastId: "group-creation",
                            })
                        }
                        method="post"
                    >
                        <input
                            type="hidden"
                            name="intent"
                            value="create-group"
                        />
                        <CustomInput
                            type="text"
                            labelText="Group title"
                            id="group-title"
                            icon="group_add"
                            placeholder="Programming"
                            required
                            name="title"
                            clarification="Use only letters and numbers."
                        />
                        <CustomInput
                            type="text"
                            labelText="Group description"
                            id="group-description"
                            icon="description"
                            placeholder="In this group we talk about programming."
                            required
                            name="description"
                            clarification="Tell the people what is your group about!"
                        />
                        <PillButton
                            buttonAriaLabel="Create your group"
                            buttonText="Create your group"
                            includeEmptySpace
                            includeIcon
                            icon="add"
                            type="submit"
                            buttonTitle="Create"
                        />
                    </fetcher.Form>
                </Popover>
                <div className="button">
                    <button className={classes.roundDefaultButton}>
                        <span
                            className={`material-symbols-rounded ${classes.defaultIcon}`}
                        >
                            diversity_2
                        </span>
                    </button>
                </div>
                <div className="button">
                    <button className={classes.roundDefaultButton}>
                        <span
                            className={`material-symbols-rounded ${classes.defaultIcon}`}
                        >
                            hub
                        </span>
                    </button>
                </div>
            </div>
            <Suspense
                fallback={<CustomPageLoader message="Getting groups..." />}
            >
                <Await
                    resolve={groupsPromise}
                    errorElement={
                        <LoaderErrorElement
                            icon="bomb"
                            title="Unable to get groups."
                        />
                    }
                >
                    {(groups) => {
                        console.log("The content of groups is: ", groups);
                        return groups.length === 0 ? (
                            <EmptySection
                                icon="group_off"
                                message="Nobody has created a group yet."
                            />
                        ) : (
                            <div className={styles.groupsContainer}>
                                {groups.map((group, i) => {
                                    const isYourGroup =
                                        user?.id === group.ownerId;

                                    // If logged user is participant and not owner of the group.
                                    const isParticipant =
                                        group.participants.find(
                                            (participant) => {
                                                return (
                                                    participant.userId ===
                                                        user?.id &&
                                                    participant.role !== "OWNER"
                                                );
                                            },
                                        );

                                    const currentIntent = fetcher.formData?.get(
                                        "intent",
                                    ) as "join-group" | "leave-group";

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
                                                    className={`${classes.roundDefaultButton} ${styles.loadingButton}`}
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
                                                    popoverContainerClass={
                                                        styles.leaveGroupButton
                                                    }
                                                    anchorButtonClass={
                                                        classes.roundDefaultButton
                                                    }
                                                    anchorButtonAriaLabel={`Leave group: "${group.title}".`}
                                                    anchorButtonTitle="Leave group"
                                                    altPopoverClass={
                                                        styles.leaveGroupPopover
                                                    }
                                                >
                                                    <fetcher.Form
                                                        onSubmit={() =>
                                                            setToastData({
                                                                loadingMessage:
                                                                    "Leaving group...",
                                                                failMessage:
                                                                    "Error while leaving group.",
                                                                toastId:
                                                                    "leave-group",
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
                                                        <h2
                                                            className={`${classes.titleSmall}`}
                                                        >
                                                            Are you sure you
                                                            want to leave this
                                                            group?
                                                        </h2>
                                                        <div
                                                            className={
                                                                classes.separator
                                                            }
                                                        ></div>
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
                                                            className={`${classes.defaultIcon} material-symbols-rounded`}
                                                        >
                                                            meeting_room
                                                        </span>
                                                    }
                                                    popoverContainerClass={
                                                        styles.joinGroupButton
                                                    }
                                                    anchorButtonClass={
                                                        classes.roundDefaultButton
                                                    }
                                                    anchorButtonAriaLabel={`Join group: "${group.title}".`}
                                                    anchorButtonTitle="Join group"
                                                    altPopoverClass={
                                                        styles.joinGroupPopover
                                                    }
                                                >
                                                    <fetcher.Form
                                                        onSubmit={() =>
                                                            setToastData({
                                                                loadingMessage:
                                                                    "Joining group...",
                                                                failMessage:
                                                                    "Error while joining group.",
                                                                toastId:
                                                                    "join-group",
                                                            })
                                                        }
                                                        className={`
                                                            ${styles.joinGroupForm}
                                                            ${classes.flexColumn}
                                                            ${classes.floatingForm}
                                                        `}
                                                        method="post"
                                                    >
                                                        <input
                                                            type="hidden"
                                                            name="intent"
                                                            value="join-group"
                                                        />
                                                        <h2
                                                            className={`${classes.titleSmall}`}
                                                        >
                                                            Confirm joining
                                                            group
                                                        </h2>
                                                        <div
                                                            className={
                                                                classes.separator
                                                            }
                                                        ></div>
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
                                                src={
                                                    group.profilePicture ??
                                                    undefined
                                                }
                                                alt={
                                                    group.title ??
                                                    "Group profile"
                                                }
                                                className={`${styles.ppf} ${classes.profilePictureRound} ${classes.pictureBig}`}
                                            />
                                            <h2 className={styles.groupTitle}>
                                                {group.title}
                                            </h2>
                                            <p
                                                className={`${classes.smallText} ${styles.description}`}
                                            >
                                                {group.description}
                                            </p>
                                            <div
                                                className={styles.participants}
                                            >
                                                <h4
                                                    className={
                                                        classes.textSmallSecondary
                                                    }
                                                >
                                                    Participants (
                                                    {group._count.participants})
                                                </h4>
                                                <ul
                                                    className={
                                                        styles.participantsContainer
                                                    }
                                                >
                                                    {group.participants.map(
                                                        (participant, i) => {
                                                            const name =
                                                                participant.user
                                                                    .firstName +
                                                                " " +
                                                                participant.user
                                                                    .lastName;

                                                            return i === 9 &&
                                                                group._count
                                                                    .participants >
                                                                    10 ? (
                                                                <div
                                                                    className={`${classes.pictureSmall} ${classes.profilePictureRound} ${styles.moreParticipants}`}
                                                                >
                                                                    <span
                                                                        className={`${styles.icon} material-symbols-rounded`}
                                                                    >
                                                                        add
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <li
                                                                    style={{
                                                                        transform: `translateX(-${16 * i}px)`,
                                                                    }}
                                                                    key={
                                                                        participant.userId
                                                                    }
                                                                    className={
                                                                        styles.participant
                                                                    }
                                                                >
                                                                    <img
                                                                        className={`
                                                                            ${styles.participantPpf}
                                                                            ${classes.profilePictureRound}
                                                                            ${classes.pictureSmall}
                                                                            `}
                                                                        src={
                                                                            participant
                                                                                .user
                                                                                .profilePictureUrl
                                                                        }
                                                                        alt={
                                                                            name
                                                                        }
                                                                    />
                                                                </li>
                                                            );
                                                        },
                                                    )}
                                                </ul>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        );
                    }}
                </Await>
            </Suspense>
        </main>
    );
}
