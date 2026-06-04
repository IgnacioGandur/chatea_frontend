import styles from "./Notifications.module.css";
import classes from "~/css/classes.module.css";
import Popover from "~/components/popover/Popover";
import { Await, NavLink, useFetcher, useRouteLoaderData } from "react-router";
import { Suspense } from "react";
import type { RootLoaderData } from "~/types/RootLoaderData";
import PillButton from "~/components/pill-button/PillButton";
import { useFetcherToast } from "~/hooks/useFetcherToast";
import type { $ZodIssue } from "zod/v4/core";
import ValidationErrors from "~/components/validation-errors/ValidationErrors";

interface ActionResponse {
    success: boolean;
    message: string;
    errors?: $ZodIssue[];
}

export default function Notifications() {
    const fetcher = useFetcher<ActionResponse>();
    const { friendshipRequestsPromise } = useRouteLoaderData(
        "root",
    ) as RootLoaderData;

    const icon = (
        <span
            className={`
            material-symbols-rounded
            ${classes.defaultIcon}
        `}
        >
            notifications
        </span>
    );

    const suspenseLoaderButton = (
        <button
            className={`
            ${classes.roundDefaultButton}
            ${classes.suspenseBackgroundAnimation}
            `}
        >
            <span
                className={`
            material-symbols-rounded
            ${classes.loaderIcon}
            `}
            >
                abc
            </span>
        </button>
    );

    if (!friendshipRequestsPromise) return;

    useFetcherToast(fetcher, {
        loadingMessage: "Responding request...",
        toastId: "respond-friendship",
    });

    const hasValidationErrors = fetcher.data?.success === false;
    const validationErrorMessage = fetcher.data?.message;
    const validationErrors = fetcher.data?.errors;
    const showValidationErrors =
        hasValidationErrors && validationErrorMessage && validationErrors;

    return (
        <Suspense fallback={suspenseLoaderButton}>
            <Await resolve={friendshipRequestsPromise}>
                {(requests) => {
                    return (
                        <div className={styles.notifications}>
                            {requests?.length === 0 ? null : (
                                <span className={styles.indicator}></span>
                            )}
                            <Popover
                                anchorName="--notifications"
                                popoverTarget="notifications-list"
                                buttonContent={icon}
                                anchorButtonTitle="Open notifications"
                                anchorButtonAriaLabel="Open your notifications."
                                altPopoverClass={styles.altPopoverClass}
                                popoverContainerClass={
                                    styles.popoverContainerClass
                                }
                                anchorButtonClass={classes.roundDefaultButton}
                            >
                                {requests.length === 0 ? (
                                    <div
                                        className={`
                                            ${styles.emptyNotifications}
                                            ${classes.flexColumnCenter}
                                        `}
                                    >
                                        <h3
                                            className={`
                                                ${classes.titleSmall}
                                            `}
                                        >
                                            Friendship Requests
                                        </h3>
                                        <span
                                            className={`
                                                ${classes.iconWithGradientColors}
                                                ${styles.icon}
                                                material-symbols-rounded
                                            `}
                                        >
                                            brightness_empty
                                        </span>
                                        <p
                                            className={`
                                                ${classes.smallText}
                                            `}
                                        >
                                            You don't have any friendship
                                            requests...
                                        </p>
                                    </div>
                                ) : (
                                    <div
                                        className={`
                                            ${styles.hasNotifications}
                                            ${classes.flexColumn}
                                        `}
                                    >
                                        {showValidationErrors ? (
                                            <ValidationErrors
                                                title={validationErrorMessage}
                                                errors={validationErrors}
                                            />
                                        ) : null}
                                        <h3 className={`${classes.titleSmall}`}>
                                            You have friendship requests!
                                        </h3>
                                        <div className={styles.separator}></div>
                                        <ul
                                            className={`
                                            ${classes.flexColumn}
                                            ${styles.requestsContainer}
                                            `}
                                        >
                                            {requests.map((request) => {
                                                const user = request.userA;
                                                const name = `${user.firstName} ${user.lastName}`;

                                                const isAcceptingThisRequest =
                                                    fetcher.state !== "idle" &&
                                                    fetcher.formData?.get(
                                                        "response",
                                                    ) === "accept" &&
                                                    Number(
                                                        fetcher.formData?.get(
                                                            "friendshipId",
                                                        ),
                                                    ) === Number(request.id);

                                                const isRejectingThisRequest =
                                                    fetcher.state !== "idle" &&
                                                    fetcher.formData?.get(
                                                        "response",
                                                    ) === "reject" &&
                                                    Number(
                                                        fetcher.formData?.get(
                                                            "friendshipId",
                                                        ),
                                                    ) === Number(request.id);

                                                return (
                                                    <li
                                                        key={request.id}
                                                        className={`${styles.request} ${classes.flexRowJustifySpaceBetween}`}
                                                    >
                                                        <NavLink
                                                            aria-label={`Go to ${name}'s profile`}
                                                            title={`Go to ${name}'s profile`}
                                                            to={`/users/${user.username}`}
                                                            className={
                                                                styles.link
                                                            }
                                                        >
                                                            <img
                                                                className={`${classes.profilePictureSmall} ${styles.ppf}`}
                                                                src={
                                                                    user.profilePictureUrl
                                                                }
                                                                alt={name}
                                                            />
                                                            <h4
                                                                className={
                                                                    styles.name
                                                                }
                                                            >
                                                                {name}
                                                            </h4>
                                                            <span
                                                                className={
                                                                    styles.username
                                                                }
                                                            >
                                                                @{user.username}
                                                            </span>
                                                        </NavLink>
                                                        <fetcher.Form
                                                            method="post"
                                                            action="/respond-friendship-request"
                                                            className={`${styles.buttons} ${classes.flexRowCenter}`}
                                                        >
                                                            <input
                                                                type="hidden"
                                                                name="friendshipId"
                                                                value={
                                                                    request.id
                                                                }
                                                            />
                                                            {isRejectingThisRequest ? (
                                                                <div
                                                                    className={
                                                                        classes.roundDefaultButton
                                                                    }
                                                                >
                                                                    <span
                                                                        className={`${classes.spinIcon} ${classes.icon} material-symbols-rounded`}
                                                                    >
                                                                        progress_activity
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <PillButton
                                                                    altButtonClassName={
                                                                        styles.pillButton
                                                                    }
                                                                    buttonAriaLabel={`Reject ${name}'s friendship request.`}
                                                                    buttonTitle={`Reject ${name}'s friendship request.`}
                                                                    includeEmptySpace={
                                                                        false
                                                                    }
                                                                    includeIcon={
                                                                        true
                                                                    }
                                                                    icon="person_cancel"
                                                                    type="submit"
                                                                    name="response"
                                                                    value="reject"
                                                                    buttonText=""
                                                                />
                                                            )}
                                                            {isAcceptingThisRequest ? (
                                                                <div
                                                                    className={
                                                                        classes.roundDefaultButton
                                                                    }
                                                                >
                                                                    <span
                                                                        className={`${classes.spinIcon} ${classes.icon} material-symbols-rounded`}
                                                                    >
                                                                        progress_activity
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <PillButton
                                                                    altButtonClassName={
                                                                        styles.pillButton
                                                                    }
                                                                    buttonAriaLabel={`Accept ${name}'s friendship request.`}
                                                                    buttonTitle={`Accept ${name}'s friendship request.`}
                                                                    includeEmptySpace={
                                                                        false
                                                                    }
                                                                    includeIcon={
                                                                        true
                                                                    }
                                                                    icon="person_check"
                                                                    type="submit"
                                                                    name="response"
                                                                    value="accept"
                                                                    buttonText=""
                                                                />
                                                            )}
                                                        </fetcher.Form>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}
                            </Popover>
                        </div>
                    );
                }}
            </Await>
        </Suspense>
    );
}
