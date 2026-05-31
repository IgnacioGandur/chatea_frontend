// CSS
import styles from "./CurrentConversation.module.css";

// Assets
import avatar from "/images/avatar.png";

// Session
import { getSession } from "~/session.server";

// Validators
import validateMessageInConversation from "~/validators/validateMessageInConversation";

// Db
import messagesModel from "~/db/message.model";
import conversationsModel from "~/db/conversation.model";

// Packages
import { BeatLoader } from "react-spinners";
import { NavLink, data, useFetcher, useRouteLoaderData } from "react-router";
import * as z from "zod";

// Components
import ValidationErrors from "~/components/validation-errors/ValidationErrors";

// Types
import type { Route } from "./+types/CurrentConversation";
import type { User } from "../../../../../generated/prisma/client";
import type { ValidationErrorsType } from "~/types/ValidationErrorsType";

// Validators
import participantModel from "~/db/participant.model";
import SingleMessage from "./single-message/SingleMessage";
import { CustomErrorBoundary } from "~/components/custom-error-boundary/CustomErrorBoundary";

export function meta({ loaderData, matches }: Route.MetaArgs) {
    const rootData = matches.find((route) => route?.id === "root")
        ?.loaderData as User;

    const userB =
        loaderData?.isGroup === false
            ? loaderData.participants.find((p) => p.userId !== rootData.id)
                  ?.user
            : null;

    const title = loaderData?.isGroup
        ? loaderData.title
        : `${userB?.firstName} ${userB?.lastName}`;

    if (!loaderData) {
        return [
            { title: "Unable to get conversation | Chateá!" },
            {
                name: "description",
                content: "The conversation is not available.",
            },
        ];
    }

    return [
        { title: `Conversation with ${title} | Chateá!` },
        { name: "description", content: "You current conversation in Chateá!" },
    ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
    const { id: conversationId } = params;
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (!userId) {
        throw data("Unauthorized", {
            status: 401,
            statusText: "Only for logged users.",
        });
    }

    // Validate user provided inputs.
    const validation = await z
        .object({
            loggedUserId: z.number(""),
            conversationId: z.number(""),
        })
        .safeParseAsync({
            loggedUserId: Number(userId),
            conversationId: Number(params.id),
        });

    if (!validation.success) {
        throw data("Bad Request", {
            status: 400,
            statusText: "Invalid ID format.",
        });
    }

    const conversationExists = await conversationsModel.get(conversationId);

    if (!conversationExists) {
        throw data("Not Found", {
            status: 404,
            statusText: "The conversation you are looking for doesn't exist.",
        });
    }

    const isParticipant =
        await participantModel.getParticipantByUserIdAndConversationId(
            userId,
            conversationId,
        );

    if (!isParticipant) {
        throw data("Forbidden", {
            status: 403,
            statusText: "You are not a part of this conversation.",
        });
    }

    const conversation = await conversationsModel.getConversationById(
        userId,
        conversationId,
    );

    return conversation;
}

export async function action({ request, params }: Route.ActionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const senderId = session.get("userId");
    const { id: conversationId } = params;

    const formData = await request.formData();
    const values = Object.fromEntries(formData) as {
        message: string;
    };

    const validation =
        await validateMessageInConversation.safeParseAsync(values);

    if (!validation.success) {
        return {
            success: false,
            message: "Can't send message",
            errors: validation.error.issues,
        };
    }

    if (!senderId) {
        throw new Response("Not logged.", {
            status: 401,
            statusText: "User not logged.",
        });
    }

    const message = await messagesModel.create(
        conversationId,
        values.message,
        senderId,
    );

    return {
        success: true,
        message,
    };
}

export default function CurrentConversation({
    loaderData,
}: Route.ComponentProps) {
    const rootData = useRouteLoaderData("root") as User;
    const fetcher = useFetcher<ValidationErrorsType>();
    const isGroup = loaderData?.isGroup;

    const userB = loaderData?.participants.find(
        (p) => p.userId !== rootData.id,
    )?.user;

    const name = userB ? `${userB.firstName} ${userB.lastName}` : null;
    const username = userB ? userB.username : null;

    const title = isGroup ? loaderData.title : name;

    const ppf = isGroup ? loaderData.profilePicture : userB?.profilePictureUrl;
    const messages = loaderData?.messages;
    const toLink = userB ? `/users/${userB.username}` : "";

    // Validation errors
    const hasValidationErrors = fetcher.data?.success === false;
    const validationErrorMessage = fetcher.data?.message;
    const validationErrors = fetcher.data?.errors;
    const showValidationErrors =
        hasValidationErrors && validationErrorMessage && validationErrors;

    // Notifications
    const isNotIdle = fetcher.state !== "idle";

    return (
        <section className={styles.currentConversation}>
            <header className={styles.header}>
                {isGroup ? (
                    <p>group header</p>
                ) : (
                    <NavLink
                        title="Go to this user's profile"
                        className={styles.userInfo}
                        to={toLink}
                    >
                        <img
                            src={ppf || avatar}
                            alt={title || "Profile picture"}
                            className={styles.ppf}
                        />
                        <div className={styles.names}>
                            <h1 className={styles.title}>{title}</h1>
                            {username ? (
                                <p className={styles.username}>@{username}</p>
                            ) : null}
                        </div>
                    </NavLink>
                )}
            </header>
            {showValidationErrors ? (
                <ValidationErrors
                    errors={validationErrors}
                    title={validationErrorMessage || "Validation errors"}
                />
            ) : null}
            {messages?.length === 0 || !messages ? (
                <div className={styles.noMessages}>
                    <h1>No messages</h1>
                </div>
            ) : (
                <ul className={styles.messages}>
                    {messages.map((m) => {
                        return (
                            <SingleMessage
                                key={m.id}
                                message={m}
                            />
                        );
                    })}
                </ul>
            )}
            {isNotIdle ? (
                <div className={styles.messageLoader}>
                    <p className={styles.message}>Sending message...</p>
                    <BeatLoader
                        size="9px"
                        color="var(--color-secondary)"
                    />
                </div>
            ) : (
                <fetcher.Form
                    className={styles.sendMessageForm}
                    method="post"
                >
                    <input
                        className={styles.input}
                        type="text"
                        name="message"
                        id="message"
                        placeholder={`Hello ${userB ? userB.firstName : "guys"}, how are you doing today?`}
                    />
                    <button
                        title="Send your message!"
                        className={styles.sendMessageButton}
                        type="submit"
                    >
                        <span
                            className={`material-symbols-rounded ${styles.icon}`}
                        >
                            arrow_warm_up
                        </span>
                    </button>
                </fetcher.Form>
            )}
        </section>
    );
}

export const ErrorBoundary = CustomErrorBoundary;
