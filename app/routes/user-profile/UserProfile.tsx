import UserProfileErrorElement from "./UserProfileErrorElement";
import type { $ZodIssue } from "zod/v4/core";
import logo from "~/../public/images/icon_light.svg";
import type { loader as RootLoaderType } from "../../root.tsx";
import { getLoggedUserId } from "~/utils/getLoggedUserId";
import classes from "~/css/classes.module.css";
import { format } from "date-fns";
import Skeleton from "./Skeleton";
import styles from "./UserProfile.module.css";
import type { Route } from "./+types/UserProfile";
import userModel from "~/db/user.model";
import { Suspense } from "react";
import { Await, useFetcher, useRouteLoaderData } from "react-router";
import type { MaterialSymbol } from "material-symbols";
import { validateSendFriendshipRequest } from "~/validators/validateSendFriendshipRequest";
import friendshipModel from "~/db/friendship.model";
import { BarLoader } from "react-spinners";
import { validateCancelFriendshipRequest } from "~/validators/validateCancelFriendshipRequest";
import ValidationErrors from "~/components/validation-errors/ValidationErrors";

export async function loader({ request, params }: Route.LoaderArgs) {
    const { loggedUserId } = await getLoggedUserId(request);

    const { username } = params;

    const data = userModel.getUserPublicProfileByUsername(
        username,
        loggedUserId ? Number(loggedUserId) : null,
    );

    return { data, requestId: crypto.randomUUID() };
}

const intents = ["send-friendship-request", "cancel-friendship"] as const;

type ActionIntents = (typeof intents)[number];

type ActionFormValues = {
    intent: ActionIntents;
    friendshipId: string;
};

type ActionResult =
    | {
          success: true;
          message: string;
      }
    | {
          success: false;
          message: string;
          errors?: $ZodIssue[];
      };

export async function action({
    request,
    params,
}: Route.ActionArgs): Promise<ActionResult> {
    const { loggedUserId } = await getLoggedUserId(request);
    const formData = await request.formData();
    const intent = formData.get("intent") as ActionIntents;
    const values = Object.fromEntries(formData) as ActionFormValues;
    const userAId = Number(loggedUserId);

    try {
        const user = await userModel.get(params.username);

        if (!user) {
            return {
                success: false,
                message: "Invalid username.",
            };
        }

        switch (intent) {
            case "send-friendship-request": {
                const { id: userBId } = user;

                const validation = await validateSendFriendshipRequest(
                    userAId,
                    userBId,
                );

                if (!validation.success) {
                    return {
                        success: false,
                        message:
                            "We were not able to send the friendship request: ",
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

            case "cancel-friendship": {
                const { friendshipId } = values;
                const validation = await validateCancelFriendshipRequest(
                    Number(loggedUserId),
                    Number(friendshipId),
                );

                if (!validation.success) {
                    return {
                        success: false,
                        message:
                            "We were not able to cancel your friendship request.",
                        errors: validation.error.issues,
                    };
                }

                await friendshipModel.cancelFriendshipRequest(
                    Number(validation.data?.friendshipId),
                );

                return {
                    success: true,
                    message: "Friendship removed.",
                };
            }

            default: {
                return {
                    success: false,
                    message: "Invalid intent.",
                };
            }
        }
    } catch (error) {
        console.error("Friendship action failed: ", error);
        return {
            success: false,
            message: "Something went wrong, please try again...",
        };
    }
}

export type Stat = {
    name: string;
    count: number | string;
    icon: MaterialSymbol;
};

export default function UserProfile({ loaderData }: Route.ComponentProps) {
    const rootData = useRouteLoaderData<typeof RootLoaderType>("root");
    const loggedUser = rootData?.user;
    const { data } = loaderData;
    const fetcher = useFetcher<typeof action>();

    const isNotIdle = fetcher.state !== "idle";

    // HTML
    const friendshipFormLoader = (
        <div
            className={`
                ${styles.loaderWrapper}
                ${classes.flexColumnStartCenter}
                ${classes.outline1}
            `}
        >
            <BarLoader color="var(--color-main)" />
        </div>
    );

    const cancelFriendshipInputHtml = (
        <input
            type="hidden"
            name="intent"
            value="cancel-friendship"
        />
    );

    const sendFriendshipRequestHtml = (
        <>
            <input
                type="hidden"
                name="intent"
                value="send-friendship-request"
            />
            <button
                className={`
                    ${styles.button}
                    ${classes.flexRowStartCenter}
                    ${classes.outline1}
                `}
                type="submit"
            >
                <span className="material-symbols-rounded">person_add</span>
                <div className={styles.separator}></div>
                <span className={styles.text}>Send friendship request</span>
            </button>
        </>
    );

    const cancelFriendshipRequestHtml = (
        <>
            {cancelFriendshipInputHtml}
            <button
                className={`
                    ${styles.button}
                    ${classes.flexRowStartCenter}
                    ${classes.outline1}
                `}
                type="submit"
            >
                <span className="material-symbols-rounded">person_cancel</span>
                <div className={styles.separator}></div>
                <span className={styles.text}>Cancel friendship request</span>
            </button>
        </>
    );

    const removeFromFriendsHtml = (
        <>
            {cancelFriendshipInputHtml}
            <button
                className={`
                    ${styles.button}
                    ${classes.flexRowStartCenter}
                `}
                type="submit"
            >
                <span className="material-symbols-rounded">person_remove</span>
                <div className={styles.separator}></div>
                <span className={styles.text}>Remove from friends</span>
            </button>
        </>
    );
    // ====

    return (
        <Suspense fallback={<Skeleton />}>
            <Await
                key={loaderData.requestId}
                resolve={data}
                errorElement={
                    <UserProfileErrorElement errorType="await-error" />
                }
            >
                {(data) => {
                    if (!data)
                        return (
                            <UserProfileErrorElement errorType="not-found" />
                        );

                    const {
                        user,
                        friendshipsCount,
                        ownedGroupsCount,
                        participantGroupsCount,
                        sentMessagesCount,
                    } = data;

                    const stats: Stat[] = [
                        {
                            name: "joined on",
                            count: format(data.user.joinedOn, "MMMM do, yyyy"),
                            icon: "calendar_month",
                        },
                        {
                            name: "friendships",
                            count: friendshipsCount,
                            icon: "handshake",
                        },
                        {
                            name: "sent messages",
                            count: sentMessagesCount,
                            icon: "comic_bubble",
                        },
                        {
                            name: "owned groups",
                            count: ownedGroupsCount,
                            icon: "crown",
                        },
                        {
                            name: "participant in groups",
                            count: participantGroupsCount,
                            icon: "person_raised_hand",
                        },
                    ];

                    const name = `${user.firstName} ${user.lastName}`;
                    const friendship = data.friendshipStatusWithLoggedUser;
                    const isLoggedUserProfile = data.user.id === loggedUser?.id;

                    const pageTitle = `${name}'s profile | Chateá!`;

                    // FIX: Display the friendship button only if there's a logged user.

                    return (
                        <main
                            className={`
                                    ${styles.userProfile}
                                    ${classes.flexColumn}
                                `}
                        >
                            <title>{pageTitle}</title>
                            {fetcher.data && fetcher.data.success === false ? (
                                <ValidationErrors
                                    title={fetcher.data.message}
                                    errors={fetcher.data.errors || []}
                                />
                            ) : null}
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
                                <img
                                    className={`
                                            ${styles.ppf}
                                            ${classes.correctImage}
                                            ${classes.profilePictureRound}
                                            ${classes.pictureBig}
                                        `}
                                    src={user.profilePictureUrl}
                                    alt={name}
                                />
                            </div>
                            <div
                                className={`
                                    ${styles.nameAndFriendship}
                                    ${classes.flexRowAlignCenterJustifyBetween}
                                `}
                            >
                                <div className={styles.names}>
                                    <h1>{name}</h1>
                                    <p
                                        className={`
                                                ${styles.username}
                                                ${classes.textMainDimmedItalic}
                                            `}
                                    >
                                        @{user.username}
                                    </p>
                                </div>
                                {isNotIdle ? (
                                    friendshipFormLoader
                                ) : (
                                    <fetcher.Form
                                        method="post"
                                        className={styles.friendshipForm}
                                    >
                                        {isLoggedUserProfile ? (
                                            <p
                                                className={`
                                                        ${styles.yourProfile}
                                                        ${classes.flexRowStartCenter}
                                                    `}
                                            >
                                                <span
                                                    aria-hidden
                                                    className={`
                                                        material-symbols-rounded
                                                        ${styles.icon}
                                                        `}
                                                >
                                                    verified
                                                </span>
                                                <span
                                                    aria-hidden
                                                    className={styles.separator}
                                                ></span>
                                                <span className={styles.text}>
                                                    Your Profile
                                                </span>
                                            </p>
                                        ) : friendship ? (
                                            friendship.status === "ACCEPTED" ? (
                                                <>
                                                    {removeFromFriendsHtml}
                                                    <input
                                                        type="hidden"
                                                        name="friendshipId"
                                                        value={friendship.id}
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    {
                                                        cancelFriendshipRequestHtml
                                                    }
                                                    <input
                                                        type="hidden"
                                                        name="friendshipId"
                                                        value={friendship.id}
                                                    />
                                                </>
                                            )
                                        ) : (
                                            sendFriendshipRequestHtml
                                        )}
                                    </fetcher.Form>
                                )}
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
                                    {stats.map((s) => {
                                        return (
                                            <li
                                                key={s.name}
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
                                                    <h3
                                                        className={styles.title}
                                                    >
                                                        {s.name}
                                                    </h3>
                                                </header>
                                                <div
                                                    className={`
                                                            ${styles.countWrapper}
                                                        `}
                                                >
                                                    <span
                                                        className={`
                                                                ${styles.count}
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
                }}
            </Await>
        </Suspense>
    );
}

export function ErrorBoundary() {
    return <UserProfileErrorElement errorType="error-boundary" />;
}
