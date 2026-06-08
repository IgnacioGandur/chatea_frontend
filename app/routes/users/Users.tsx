// CSS
import styles from "./Users.module.css";
import classes from "~/css/classes.module.css";

// Components
import SingleUser from "./single-user/SingleUser";
import CustomPageLoader from "~/components/custom-page-loader/CustomPageLoader";
import Popover from "~/components/popover/Popover";
import SendMessageForm from "./single-user/send-message-form/SendMessageForm";
import PillButton from "~/components/pill-button/PillButton";
import PageHeader from "~/components/page-header/PageHeader";
import LoaderErrorElement from "~/components/loader-error-element/LoaderErrorElement";

// Packages
import * as z from "zod";
import { Suspense } from "react";
import { Await, useFetcher, useRouteLoaderData, data } from "react-router";

// Types
import type { Route } from "./+types/Users";
import type { Friendship, User } from "~/../generated/prisma/client";
import type { $ZodIssue } from "zod/v4/core";

// Db
import userModel from "~/db/user.model";
import friendshipModel from "~/db/friendship.model";

// Session
import { getSession } from "~/session.server";

// Utilities
import ValidationErrors from "~/components/validation-errors/ValidationErrors";
import EmptySection from "~/components/empty-section/EmptySection";
import { checkForValidationErrors } from "~/utils/checkForValidationErrors";
import { useFetcherToast } from "~/hooks/useFetcherToast";
import { validateSendFriendshipRequest } from "~/validators/validateSendFriendshipRequest";
import { validateCancelFriendshipRequest } from "~/validators/validateCancelFriendshipRequest";
import { validateFriendshipRequestResponse } from "~/validators/validateFriendshipRequestResponse";

export function meta({}: Route.MetaArgs) {
    return [
        {
            title: "Users | Chateá!",
        },
        {
            name: "description",
            content: "Meet new friends in Chateá!",
        },
    ];
}

export async function loader({ request }: Route.LoaderArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");
    let friendshipsPromise: Promise<Friendship[] | null> | undefined;

    if (userId) {
        friendshipsPromise = friendshipModel.getUserFriendships(userId);
    }

    const usersPromise = userModel.getAll();

    return { usersPromise, friendshipsPromise };
}

type FormValues = {
    userAId: string;
    userBId: string;
    intent:
        | "send-friendship-request"
        | "cancel-friendship-request"
        | "respond-friendship-request";
    friendshipId: string;
    response: "accept" | "reject";
};

export async function action({ request }: Route.ActionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const loggedUserId = session.get("userId");

    if (!loggedUserId) {
        throw data("Forbidden", {
            status: 403,
            statusText: "Only logged users can send friendship requests.",
        });
    }

    const formData = await request.formData();
    const values = Object.fromEntries(formData) as FormValues;

    const intentValidation = z
        .object({
            intent: z.enum([
                "send-friendship-request",
                "cancel-friendship-request",
                "respond-friendship-request",
            ]),
        })
        .safeParse({ intent: values.intent });

    if (!intentValidation.success) {
        return {
            success: false,
            message: "You provided an invalid intent.",
            errors: intentValidation.error.issues,
        };
    }

    values.userAId = loggedUserId;

    switch (values.intent) {
        case "send-friendship-request": {
            const userAId = Number(values.userAId);
            const userBId = Number(values.userBId);

            const validation = await validateSendFriendshipRequest(
                userAId,
                userBId,
            );

            if (!validation.success) {
                return {
                    success: false,
                    message: "Friendship request failed.",
                    errors: validation.error.issues,
                };
            }

            await friendshipModel.create(
                validation.data.userAId,
                validation.data.userBId,
            );

            return {
                success: true,
                message: "Friendship request sent!",
            };
        }

        case "cancel-friendship-request": {
            const userAId = Number(loggedUserId);
            const friendshipId = Number(values.friendshipId);

            const validation = await validateCancelFriendshipRequest(
                userAId,
                friendshipId,
            );

            if (!validation.success) {
                return {
                    success: false,
                    message: "Unable to cancel friendship.",
                    errors: validation.error.issues,
                };
            }

            await friendshipModel.cancelFriendshipRequest(
                validation.data.friendshipId,
            );

            return {
                success: true,
                message: "Friendship request canceled.",
            };
        }

        case "respond-friendship-request": {
            const friendshipId = Number(values.friendshipId);
            const validation = await validateFriendshipRequestResponse(
                Number(loggedUserId),
                friendshipId,
                values.response,
            );

            if (!validation.success) {
                return {
                    success: false,
                    message: "Response to friendship request failed.",
                    errors: validation.error.issues,
                };
            }

            const response = await friendshipModel.handleFriendshipRequest(
                validation.data.response,
                validation.data.friendshipId,
            );

            return {
                success: true,
                message: response,
            };
        }
    }
}

interface ActionResponse {
    success: boolean;
    message: string;
    errors: $ZodIssue[];
    isSendingMessage: boolean;
}

export default function Users({ loaderData }: Route.ComponentProps) {
    const fetcher = useFetcher<ActionResponse>();
    const { user: rootData } = useRouteLoaderData("root") as {
        user: Omit<User, "password">;
    };

    const { usersPromise, friendshipsPromise } = loaderData;

    const currentIntent = fetcher.formData?.get("intent");
    const isHandlingFriendship = fetcher.state !== "idle" && currentIntent;

    const showValidationErrors =
        checkForValidationErrors(fetcher) && !fetcher.data?.isSendingMessage;

    const setToastData = useFetcherToast(fetcher);

    const buttonLoader = (
        <div
            className={`${classes.roundDefaultButton} ${classes.suspenseBackgroundAnimation}`}
        >
            <span className={`${classes.defaultIcon} material-symbols-rounded`}>
                progress_activity
            </span>
        </div>
    );

    const friendshipErrorElement = (
        <div className={styles.friendshipErrorElement}>
            <p
                className={`
                ${styles.message}
                ${classes.smallText}
                `}
            >
                Can't load your friendship status with this user.
            </p>
        </div>
    );

    const suspenseLoaderButton = (
        <div
            className={`
            ${classes.suspenseBackgroundAnimation}
            ${classes.roundDefaultButton}
            `}
        >
            <span className={`${classes.loaderIcon} material-symbols-rounded`}>
                abc
            </span>
        </div>
    );

    return (
        <main className={styles.users}>
            <PageHeader
                title="Users"
                icon="groups"
            />
            {showValidationErrors && (
                <ValidationErrors
                    errors={fetcher.data!.errors}
                    title={fetcher.data!.message}
                />
            )}
            <Suspense
                fallback={
                    <CustomPageLoader
                        message="Getting users..."
                        color="var(--color-main)"
                    />
                }
            >
                <Await
                    resolve={usersPromise}
                    errorElement={
                        <LoaderErrorElement
                            icon="bomb"
                            title="We were not able to retrieve users."
                        />
                    }
                >
                    {(users) => {
                        if (users.length === 0) {
                            return (
                                <EmptySection
                                    icon="sentiment_worried"
                                    message="Nobody has registered yet..."
                                    linkMessage="Be the first one!"
                                    linkPath="/register"
                                />
                            );
                        }

                        return (
                            <ul className={styles.usersContainer}>
                                {users.map((user, i) => {
                                    if (!rootData) {
                                        return (
                                            <SingleUser
                                                key={user.id}
                                                isYou={false}
                                                user={user}
                                            />
                                        );
                                    }

                                    const isYou = user.id === rootData.id;

                                    const name = (
                                        <span className={styles.name}>
                                            {user.firstName} {user.lastName}
                                        </span>
                                    );

                                    const isSendingFriendshipRequest =
                                        isHandlingFriendship &&
                                        currentIntent ===
                                            "send-friendship-request" &&
                                        Number(
                                            fetcher.formData?.get("userBId"),
                                        ) === user.id;

                                    const isSendingMessageToThisUser =
                                        fetcher.state !== "idle" &&
                                        Number(
                                            fetcher.formData?.get("userBId"),
                                        ) === user.id;

                                    return (
                                        <SingleUser
                                            key={user.id}
                                            isYou={isYou}
                                            user={user}
                                        >
                                            <div
                                                className={
                                                    styles.buttonsSection
                                                }
                                            >
                                                <Popover
                                                    anchorButtonAriaLabel={`Send a message to ${user.username}`}
                                                    anchorButtonTitle="Show message form"
                                                    popoverTarget={`message-to-user-${i}`}
                                                    anchorName={`--message-to-user-${i}`}
                                                    anchorButtonClass={
                                                        classes.roundDefaultButton
                                                    }
                                                    buttonContent={
                                                        <span
                                                            className={`
                                                                material-symbols-rounded
                                                                ${classes.defaultIcon}
                                                                ${isSendingMessageToThisUser ? classes.spinIcon : ""}
                                                            `}
                                                        >
                                                            {isSendingMessageToThisUser
                                                                ? "progress_activity"
                                                                : "comic_bubble"}
                                                        </span>
                                                    }
                                                    altPopoverClass={
                                                        styles.sendMessagePopover
                                                    }
                                                >
                                                    <SendMessageForm
                                                        altFetcher={fetcher}
                                                        formAction="/send-message"
                                                        userBId={user.id}
                                                    />
                                                </Popover>
                                                <Suspense
                                                    fallback={
                                                        suspenseLoaderButton
                                                    }
                                                >
                                                    <Await
                                                        resolve={
                                                            friendshipsPromise
                                                        }
                                                        errorElement={
                                                            friendshipErrorElement
                                                        }
                                                    >
                                                        {(friendships) => {
                                                            if (!friendships)
                                                                return;

                                                            // Find the friendship (if any) between the logged user and the user being rendered.
                                                            const friendship =
                                                                friendships.find(
                                                                    (f) => {
                                                                        return (
                                                                            (f.userAId ===
                                                                                Number(
                                                                                    rootData.id,
                                                                                ) &&
                                                                                f.userBId ===
                                                                                    user.id) ||
                                                                            (f.userAId ===
                                                                                user.id &&
                                                                                f.userBId ===
                                                                                    Number(
                                                                                        rootData.id,
                                                                                    ))
                                                                        );
                                                                    },
                                                                );

                                                            // If this user is already your friend.
                                                            const alreadyFriends =
                                                                friendship?.status ===
                                                                "ACCEPTED";

                                                            // If there's a pending friendship request and the logged user sent it.
                                                            const waitingForUserBResponse =
                                                                friendship?.status ===
                                                                    "PENDING" &&
                                                                friendship.userAId ===
                                                                    rootData.id;

                                                            // If the logged user has a pending friendship request from this user.
                                                            const waitingForYourResponse =
                                                                friendship?.status ===
                                                                    "PENDING" &&
                                                                friendship.userBId ===
                                                                    rootData.id;

                                                            const isCancelingFriendship =
                                                                friendship &&
                                                                isHandlingFriendship &&
                                                                currentIntent ===
                                                                    "cancel-friendship-request" &&
                                                                Number(
                                                                    fetcher.formData?.get(
                                                                        "friendshipId",
                                                                    ),
                                                                ) ===
                                                                    Number(
                                                                        friendship.id,
                                                                    );

                                                            const IsLoggedUserRespondingToRequest =
                                                                friendship &&
                                                                currentIntent &&
                                                                currentIntent ===
                                                                    "respond-friendship-request" &&
                                                                Number(
                                                                    fetcher.formData?.get(
                                                                        "friendshipId",
                                                                    ),
                                                                ) ===
                                                                    Number(
                                                                        friendship.id,
                                                                    );

                                                            return isSendingFriendshipRequest ? (
                                                                <>
                                                                    {
                                                                        buttonLoader
                                                                    }
                                                                </>
                                                            ) : alreadyFriends ? (
                                                                isCancelingFriendship ? (
                                                                    <>
                                                                        {
                                                                            buttonLoader
                                                                        }
                                                                    </>
                                                                ) : (
                                                                    <Popover
                                                                        altPopoverClass={
                                                                            styles.friendshipPopover
                                                                        }
                                                                        anchorButtonAriaLabel={`Remove ${user.username} from your friends list.`}
                                                                        anchorName={`--remove-friendship-with-${user.username}`}
                                                                        popoverTarget={`remove-friendship-with-${user.username}`}
                                                                        anchorButtonClass={
                                                                            classes.roundDefaultButton
                                                                        }
                                                                        anchorButtonTitle="Remove this user from your friends list."
                                                                        buttonContent={
                                                                            <span
                                                                                className={`${classes.defaultIcon} material-symbols-rounded`}
                                                                            >
                                                                                person_remove
                                                                            </span>
                                                                        }
                                                                    >
                                                                        <fetcher.Form
                                                                            onSubmit={() =>
                                                                                setToastData(
                                                                                    {
                                                                                        failMessage:
                                                                                            "Error while removing friend.",
                                                                                        loadingMessage:
                                                                                            "Removing from friends...",
                                                                                        toastId:
                                                                                            "remove-friend",
                                                                                    },
                                                                                )
                                                                            }
                                                                            className={
                                                                                styles.friendshipForm
                                                                            }
                                                                            method="post"
                                                                        >
                                                                            <input
                                                                                type="hidden"
                                                                                name="intent"
                                                                                value="cancel-friendship-request"
                                                                            />
                                                                            <h3
                                                                                className={
                                                                                    styles.formTitle
                                                                                }
                                                                            >
                                                                                Remove{" "}
                                                                                {
                                                                                    name
                                                                                }{" "}
                                                                                from
                                                                                your
                                                                                friends
                                                                                list?
                                                                            </h3>
                                                                            <PillButton
                                                                                altButtonClassName={
                                                                                    styles.pillButton
                                                                                }
                                                                                buttonAriaLabel="Confirm friendship deletion."
                                                                                buttonTitle="Confirm friendship deletion"
                                                                                includeEmptySpace={
                                                                                    true
                                                                                }
                                                                                includeIcon={
                                                                                    false
                                                                                }
                                                                                type="submit"
                                                                                buttonText="Confirm"
                                                                                name="friendshipId"
                                                                                value={
                                                                                    friendship.id
                                                                                }
                                                                            />
                                                                        </fetcher.Form>
                                                                    </Popover>
                                                                )
                                                            ) : waitingForUserBResponse ? (
                                                                isCancelingFriendship ? (
                                                                    <>
                                                                        {
                                                                            buttonLoader
                                                                        }
                                                                    </>
                                                                ) : (
                                                                    <Popover
                                                                        altPopoverClass={
                                                                            styles.friendshipPopover
                                                                        }
                                                                        anchorButtonAriaLabel={`Cancel friendship request to ${user.username}`}
                                                                        anchorName={`--cancel-friendship-request-with-${user.username}`}
                                                                        popoverTarget={`cancel-friendship-request-${user.username}`}
                                                                        anchorButtonClass={
                                                                            classes.roundDefaultButton
                                                                        }
                                                                        buttonContent={
                                                                            <span
                                                                                className={`${classes.defaultIcon} material-symbols-rounded`}
                                                                            >
                                                                                person_cancel
                                                                            </span>
                                                                        }
                                                                        anchorButtonTitle="Cancel friendship request"
                                                                    >
                                                                        <fetcher.Form
                                                                            onSubmit={() =>
                                                                                setToastData(
                                                                                    {
                                                                                        loadingMessage:
                                                                                            "Canceling request...",
                                                                                        failMessage:
                                                                                            "Error while canceling request.",
                                                                                        toastId:
                                                                                            "Cancel-request",
                                                                                    },
                                                                                )
                                                                            }
                                                                            className={
                                                                                styles.friendshipForm
                                                                            }
                                                                            method="delete"
                                                                        >
                                                                            <input
                                                                                type="hidden"
                                                                                name="intent"
                                                                                value="cancel-friendship-request"
                                                                            />
                                                                            <input
                                                                                type="hidden"
                                                                                name="friendshipId"
                                                                                value={
                                                                                    friendship.id
                                                                                }
                                                                            />
                                                                            <h3
                                                                                className={
                                                                                    styles.formTitle
                                                                                }
                                                                            >
                                                                                Cancel
                                                                                your
                                                                                friendship
                                                                                request
                                                                                to{" "}
                                                                                {
                                                                                    name
                                                                                }

                                                                                ?
                                                                            </h3>
                                                                            <PillButton
                                                                                buttonAriaLabel="Confirm the cancelation of your friendship request"
                                                                                altButtonClassName={
                                                                                    styles.pillButton
                                                                                }
                                                                                buttonTitle="Confirm the cancelation of your friendship request"
                                                                                includeEmptySpace={
                                                                                    false
                                                                                }
                                                                                includeIcon={
                                                                                    false
                                                                                }
                                                                                type="submit"
                                                                                buttonText="Confirm"
                                                                            />
                                                                        </fetcher.Form>
                                                                    </Popover>
                                                                )
                                                            ) : waitingForYourResponse ? (
                                                                IsLoggedUserRespondingToRequest ? (
                                                                    <>
                                                                        {
                                                                            buttonLoader
                                                                        }
                                                                    </>
                                                                ) : (
                                                                    <Popover
                                                                        altPopoverClass={
                                                                            styles.friendshipPopover
                                                                        }
                                                                        anchorButtonAriaLabel={`Response to friendship request from ${user.username}`}
                                                                        anchorName={`--respond-friendship-request-${user.username}`}
                                                                        popoverTarget={`respond-friendship-request-${user.username}`}
                                                                        anchorButtonClass={
                                                                            classes.roundDefaultButton
                                                                        }
                                                                        buttonContent={
                                                                            <span
                                                                                className={`${classes.defaultIcon} material-symbols-rounded`}
                                                                            >
                                                                                handshake
                                                                            </span>
                                                                        }
                                                                        anchorButtonTitle="Respond friendship request"
                                                                    >
                                                                        <section
                                                                            className={
                                                                                styles.friendshipForm
                                                                            }
                                                                        >
                                                                            <h3
                                                                                className={
                                                                                    styles.formTitle
                                                                                }
                                                                            >
                                                                                {
                                                                                    name
                                                                                }{" "}
                                                                                wants
                                                                                to
                                                                                be
                                                                                your
                                                                                friend!
                                                                            </h3>
                                                                            <fetcher.Form
                                                                                onSubmit={() => {
                                                                                    setToastData(
                                                                                        {
                                                                                            loadingMessage:
                                                                                                "Responding request...",
                                                                                            failMessage:
                                                                                                "Error while responding request.",
                                                                                            toastId:
                                                                                                "respond-request",
                                                                                        },
                                                                                    );
                                                                                }}
                                                                                className={
                                                                                    styles.responseButtonsContainer
                                                                                }
                                                                                method="post"
                                                                            >
                                                                                <input
                                                                                    type="hidden"
                                                                                    name="intent"
                                                                                    value="respond-friendship-request"
                                                                                />
                                                                                <input
                                                                                    type="hidden"
                                                                                    name="friendshipId"
                                                                                    value={
                                                                                        friendship.id
                                                                                    }
                                                                                />
                                                                                <PillButton
                                                                                    buttonAriaLabel="Accept friendship request"
                                                                                    buttonTitle="Accept friendship request"
                                                                                    includeEmptySpace={
                                                                                        true
                                                                                    }
                                                                                    includeIcon={
                                                                                        true
                                                                                    }
                                                                                    icon="person_check"
                                                                                    type="submit"
                                                                                    name="response"
                                                                                    value="accept"
                                                                                    buttonText="Accept"
                                                                                />
                                                                                <PillButton
                                                                                    altButtonClassName={
                                                                                        styles.rejectButton
                                                                                    }
                                                                                    buttonAriaLabel="Reject friendship request"
                                                                                    buttonTitle="Reject friendship request"
                                                                                    includeEmptySpace={
                                                                                        true
                                                                                    }
                                                                                    includeIcon={
                                                                                        true
                                                                                    }
                                                                                    icon="person_cancel"
                                                                                    type="submit"
                                                                                    name="response"
                                                                                    value="reject"
                                                                                    buttonText="Reject"
                                                                                />
                                                                            </fetcher.Form>
                                                                        </section>
                                                                    </Popover>
                                                                )
                                                            ) : (
                                                                <fetcher.Form
                                                                    onSubmit={() =>
                                                                        setToastData(
                                                                            {
                                                                                failMessage:
                                                                                    "Error while sending request.",
                                                                                loadingMessage:
                                                                                    "Sending request...",
                                                                                toastId:
                                                                                    "send-request",
                                                                            },
                                                                        )
                                                                    }
                                                                    method="post"
                                                                >
                                                                    <input
                                                                        type="hidden"
                                                                        name="intent"
                                                                        value="send-friendship-request"
                                                                    />
                                                                    <input
                                                                        type="hidden"
                                                                        name="userBId"
                                                                        value={
                                                                            user.id
                                                                        }
                                                                    />
                                                                    <button
                                                                        title="Send a friendship request to this user."
                                                                        type="submit"
                                                                        aria-label="Send friendship request"
                                                                        className={
                                                                            classes.roundDefaultButton
                                                                        }
                                                                    >
                                                                        <span
                                                                            className={`${classes.defaultIcon} material-symbols-rounded`}
                                                                        >
                                                                            person_add
                                                                        </span>
                                                                    </button>
                                                                </fetcher.Form>
                                                            );
                                                        }}
                                                    </Await>
                                                </Suspense>
                                            </div>
                                        </SingleUser>
                                    );
                                })}
                            </ul>
                        );
                    }}
                </Await>
            </Suspense>
        </main>
    );
}
