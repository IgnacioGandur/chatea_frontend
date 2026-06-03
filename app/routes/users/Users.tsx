// CSS
import styles from "./Users.module.css";

// Components
import SingleUser from "./single-user/SingleUser";
import CustomPageLoader from "~/components/custom-page-loader/CustomPageLoader";
import Popover from "~/components/popover/Popover";
import SendMessageForm from "./single-user/send-message-form/SendMessageForm";

// Packages
import * as z from "zod";
import { Suspense, useEffect } from "react";
import { Await, useFetcher, useRouteLoaderData, data } from "react-router";

// Types
import type { Route } from "./+types/Users";
import type { Friendship, User } from "~/../generated/prisma/client";

// Db
import userModel from "~/db/user.model";

// Session
import { getSession } from "~/session.server";
import friendshipModel from "~/db/friendship.model";
import toast from "react-hot-toast";
import PillButton from "~/components/pill-button/PillButton";
import type { $ZodIssue } from "zod/v4/core";
import ValidationErrors from "~/components/validation-errors/ValidationErrors";
import checkIfUserExistsById from "~/validators/custom-validators/checkIfUserExistsById";

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

    values.userAId = loggedUserId;

    switch (values.intent) {
        case "send-friendship-request": {
            const validation = await z
                .object({
                    userAId: z.number("The userAId field should be a number."),
                    userBId: z
                        .number("The userBId field should be a number.")
                        .refine(checkIfUserExistsById, {
                            error: `The user with and ID of ${values.userBId} doesn't exist.`,
                            path: ["userBId"],
                        })
                        .refine(
                            async (userBId) => {
                                const friendshipAlreadyExists =
                                    await friendshipModel.getFriendshipBetweenUserIds(
                                        values.userAId,
                                        userBId,
                                    );

                                if (friendshipAlreadyExists) {
                                    return false;
                                }

                                return true;
                            },
                            { error: "This friendship already exists." },
                        ),
                })
                .safeParseAsync({
                    userAId: Number(values.userAId),
                    userBId: Number(values.userBId),
                });

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
            const validation = await z
                .object({
                    userAId: z.number("The userAId should be a number."),
                    friendshipId: z.number({
                        error: (issue) =>
                            `Friendship ID should be a number. Received: '${issue.input}'`,
                    }),
                })
                .superRefine(async (data, ctx) => {
                    // 'userAId' is the logged user ID.
                    const { userAId, friendshipId } = data;

                    const friendship =
                        await friendshipModel.getFriendshipById(friendshipId);

                    if (!friendship) {
                        ctx.addIssue({
                            code: "custom",
                            path: ["friendshipId"],
                            message: `The friendship with an ID of '${friendshipId}' doesn't exist.`,
                        });
                        return;
                    }

                    const loggedUserIsParticipant =
                        friendship.userAId === userAId;
                    friendship.userBId === userAId;

                    if (!loggedUserIsParticipant) {
                        ctx.addIssue({
                            code: "custom",
                            path: ["friendshipId"],
                            message: "You are not a part of this friendship.",
                        });
                    }
                })
                .safeParseAsync({
                    userAId: Number(loggedUserId),
                    friendshipId: Number(values.friendshipId),
                });

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
            const validation = await z
                .object({
                    response: z.enum(["accept", "reject"], {
                        error: (issue) =>
                            `Invalid response value. Response can only be 'accept' or 'reject'. Received: '${issue.input}'.`,
                    }),
                    friendshipId: z.number("Friendship ID should be a number."),
                })
                .superRefine(async (data, ctx) => {
                    const { friendshipId } = data;

                    const friendship =
                        await friendshipModel.getFriendshipById(friendshipId);

                    if (!friendship) {
                        ctx.addIssue({
                            code: "custom",
                            path: ["friendshipId"],
                            message: `The friendship with an ID of: '${friendshipId}' doesn't exist.`,
                        });

                        return;
                    }

                    const loggedUserIsParticipant =
                        friendship.userAId == Number(loggedUserId) ||
                        friendship.userBId == Number(loggedUserId);

                    if (!loggedUserIsParticipant) {
                        ctx.addIssue({
                            code: "custom",
                            path: ["friendshipId"],
                            message: "You are not a part of this conversation.",
                        });
                    }
                })
                .safeParseAsync({
                    friendshipId: Number(values.friendshipId),
                    response: values.response,
                });

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

        default: {
            throw data("Method Not Allowed", {
                status: 405,
                statusText: "Invalid method value.",
            });
        }
    }
}

interface ActionResponse {
    success: boolean;
    message: string;
    errors?: $ZodIssue[];
}

export default function Users({ loaderData }: Route.ComponentProps) {
    const fetcher = useFetcher<ActionResponse>();
    const rootData = useRouteLoaderData("root") as Omit<User, "password">;

    const { usersPromise, friendshipsPromise } = loaderData;

    const currentIntent = fetcher.formData?.get("intent");
    const isHandlingFriendship = fetcher.state !== "idle" && currentIntent;

    // Notifications
    // Success/Error while sending friendship request.
    useEffect(() => {
        if (fetcher.data) {
            const notificationMessage = fetcher.data.message;
            fetcher.data.success
                ? toast.success(notificationMessage)
                : toast.error(notificationMessage);
        }
    }, [fetcher.data]);

    // Waiting while the request is being handled.
    useEffect(() => {
        if (fetcher.state === "submitting") {
            toast.loading("Handling request, please wait...", {
                id: "friendship-request",
            });
        } else {
            toast.dismiss("friendship-request");
        }
    }, [fetcher.state]);

    // Validation errors (if any)
    const hasValidationErrors = fetcher.data?.success === false;
    const validationErrorMessage = fetcher.data?.message;
    const validationErrors = fetcher.data?.errors;
    const showValidationErrors =
        hasValidationErrors && validationErrorMessage && validationErrors;

    const buttonLoader = (
        <div className={`${styles.button} ${styles.loader}`}>
            <span className={`${styles.icon} material-symbols-rounded`}>
                progress_activity
            </span>
        </div>
    );

    return (
        <main className={styles.users}>
            <header className={styles.header}>
                <div className={styles.text}>
                    <span className={`${styles.icon} material-symbols-rounded`}>
                        groups
                    </span>
                    <h1 className={styles.title}>Users</h1>
                </div>
            </header>
            {showValidationErrors && (
                <ValidationErrors
                    errors={validationErrors}
                    title={validationErrorMessage}
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
                    errorElement={<p>We were not able to get users...</p>}
                >
                    {(users) => {
                        return users.length === 1 ? (
                            <div className={styles.emptyUsers}>
                                <h1>
                                    You are the only user in the platform :(
                                </h1>
                            </div>
                        ) : (
                            <ul className={styles.usersContainer}>
                                {users.map((user, i) => {
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
                                                        styles.button
                                                    }
                                                    buttonContent={
                                                        <span
                                                            className={`material-symbols-rounded ${styles.icon}`}
                                                        >
                                                            comic_bubble
                                                        </span>
                                                    }
                                                    altPopoverClass={
                                                        styles.sendMessagePopover
                                                    }
                                                >
                                                    <SendMessageForm
                                                        formAction="/send-message"
                                                        userBId={user.id}
                                                    />
                                                </Popover>
                                                <Suspense
                                                    fallback={<p>Loading...</p>}
                                                >
                                                    <Await
                                                        resolve={
                                                            friendshipsPromise
                                                        }
                                                    >
                                                        {(friendships) => {
                                                            if (!friendships)
                                                                return;

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
                                                                            styles.button
                                                                        }
                                                                        anchorButtonTitle="Remove this user from your friends list."
                                                                        buttonContent={
                                                                            <span
                                                                                className={`${styles.icon} material-symbols-rounded`}
                                                                            >
                                                                                person_remove
                                                                            </span>
                                                                        }
                                                                    >
                                                                        <fetcher.Form
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
                                                                            styles.button
                                                                        }
                                                                        buttonContent={
                                                                            <span
                                                                                className={`${styles.icon} material-symbols-rounded`}
                                                                            >
                                                                                person_cancel
                                                                            </span>
                                                                        }
                                                                        anchorButtonTitle="Cancel friendship request"
                                                                    >
                                                                        <fetcher.Form
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
                                                                            styles.button
                                                                        }
                                                                        buttonContent={
                                                                            <span
                                                                                className={`${styles.icon} material-symbols-rounded`}
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
                                                                <fetcher.Form method="post">
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
                                                                            styles.button
                                                                        }
                                                                    >
                                                                        <span
                                                                            className={`${styles.icon} material-symbols-rounded`}
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
