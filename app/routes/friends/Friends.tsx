import styles from "./Friends.module.css";
import type { Route } from "./+types/Friends";
import { getSession } from "~/session.server";
import { Await, data, useFetcher } from "react-router";
import friendshipModel from "~/db/friendship.model";
import { Suspense, useEffect } from "react";
import EmptySection from "~/components/empty-section/EmptySection";
import PageHeader from "~/components/page-header/PageHeader";
import CustomPageLoader from "~/components/custom-page-loader/CustomPageLoader";
import SingleUser from "../users/single-user/SingleUser";
import PillButton from "~/components/pill-button/PillButton";
import Popover from "~/components/popover/Popover";
import * as z from "zod";
import LoggedUser from "~/components/navbar/logged-user/LoggedUser";
import type { $ZodIssue } from "zod/v4/core";
import ValidationErrors from "~/components/validation-errors/ValidationErrors";
import SendMessageForm from "../users/single-user/send-message-form/SendMessageForm";
import toast from "react-hot-toast";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Friendships | Chateá!" },
        { name: "description", description: "All you friends in Chateá!" },
    ];
}

export async function loader({ request }: Route.LoaderArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (!userId) {
        throw data("Unauthorized.", {
            status: 401,
            statusText: "This route is for logged users only.",
        });
    }
    const friendsPromise = friendshipModel.getUserAcceptedFriendships(userId);

    return { friendsPromise, loggedUserId: userId };
}

type FormFields = {
    friendshipId: string;
    intent: "send-message" | "cancel-friendship";
};

export async function action({ request }: Route.ActionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (!userId) {
        throw data("Unauthorized.", {
            status: 401,
            statusText: "Only logged users can perform this action.",
        });
    }

    const formData = await request.formData();
    const values = Object.fromEntries(formData) as FormFields;

    const validation = await z
        .object({
            friendshipId: z.number({
                error: (issue) =>
                    `Friendship ID should be a number. Received: '${issue.input}'.`,
            }),
        })
        .superRefine(async (data, ctx) => {
            const { friendshipId } = data;

            const friendship = await friendshipModel.getFriendshipById(
                data.friendshipId,
            );

            if (!friendship) {
                ctx.addIssue({
                    code: "custom",
                    path: ["friendshipId"],
                    message: `Friendship with an ID of '${friendshipId}' doesn't exist.`,
                });
                return;
            }

            const loggedUserIsParticipant =
                friendship.userAId === Number(userId) ||
                friendship.userBId === Number(userId);

            if (!loggedUserIsParticipant) {
                ctx.addIssue({
                    code: "custom",
                    path: ["friendshipId"],
                    message: "You are not part of this friendship.",
                });
            }
        })
        .safeParseAsync({ friendshipId: Number(values.friendshipId) });

    if (!validation.success) {
        return {
            success: false,
            message: "Friendship cancelation failed.",
            errors: validation.error.issues,
        };
    }

    await friendshipModel.cancelFriendshipRequest(validation.data.friendshipId);

    return {
        success: true,
        message: "Friendship canceled.",
    };
}

type ActionResponse = {
    success: boolean;
    message: string;
    errors?: $ZodIssue[];
};

export default function Friends({ loaderData }: Route.ComponentProps) {
    const fetcher = useFetcher<ActionResponse>();
    const { friendsPromise, loggedUserId } = loaderData;

    // Notifications if there's a response from the action function.
    useEffect(() => {
        if (!fetcher.data) return;

        if (fetcher.data && fetcher.data.success) {
            toast.success(fetcher.data.message);
        } else {
            toast.error(fetcher.data?.message);
        }
    }, [fetcher.data]);

    // Loading notification
    useEffect(() => {
        if (fetcher.state !== "idle") {
            toast.loading("Handling request, wait...", {
                id: "friendship",
            });
        } else {
            toast.dismiss("friendship");
        }
    }, [fetcher.state]);

    // Validation errors
    const hasValidationErrors = fetcher.data?.success;
    const validationErrorMessage = fetcher.data?.message;
    const validationErrors = fetcher.data?.errors;

    const showValidationErrors =
        hasValidationErrors && validationErrorMessage && validationErrors;

    return (
        <main className={styles.friends}>
            <PageHeader
                title="Friends"
                icon="handshake"
            />
            {showValidationErrors ? (
                <ValidationErrors
                    title={validationErrorMessage}
                    errors={validationErrors}
                />
            ) : null}
            <Suspense
                fallback={
                    <CustomPageLoader
                        message="Getting friends..."
                        color="var(--color-main)"
                    />
                }
            >
                <Await resolve={friendsPromise}>
                    {(friendships) => {
                        return friendships.length === 0 ? (
                            <EmptySection
                                message="You don't have any friends yet..."
                                linkPath="/users"
                                linkMessage="You can meet new friends here!"
                                icon="sentiment_frustrated"
                            />
                        ) : (
                            <ul className={styles.friendsContainer}>
                                {friendships.map((friendship, i) => {
                                    const user =
                                        friendship.userAId ===
                                        Number(loggedUserId)
                                            ? friendship.userB
                                            : friendship.userA;

                                    const name = `${user.firstName} ${user.lastName}`;

                                    return (
                                        <SingleUser
                                            isYou={false}
                                            user={user}
                                            key={friendship.id}
                                            altClassName={styles.friend}
                                        >
                                            <div className={styles.buttons}>
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
                                                    anchorButtonTitle={`Remove ${name} from your friends list.`}
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
                                                        <h3
                                                            className={
                                                                styles.formTitle
                                                            }
                                                        >
                                                            Remove {name} from
                                                            your friends list?
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
                                                            includeIcon={false}
                                                            type="submit"
                                                            buttonText="Confirm"
                                                            name="friendshipId"
                                                            value={
                                                                friendship.id
                                                            }
                                                        />
                                                    </fetcher.Form>
                                                </Popover>
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
