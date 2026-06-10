// CSS
import styles from "./CurrentConversation.module.css";
import classes from "~/css/classes.module.css";

// Assets
import avatar from "/images/avatar.png";

// Session
import { getSession } from "~/session.server";

// Validators
import validateMessageInConversation from "~/validators/validateMessageInConversation";

// Db
import messagesModel from "~/db/message.model";
import conversationsModel from "~/db/conversation.model";
import participantModel from "~/db/participant.model";

// Packages
import { BeatLoader } from "react-spinners";
import {
    Await,
    NavLink,
    data,
    useFetcher,
    useRouteLoaderData,
} from "react-router";
import * as z from "zod";

// Components
import ValidationErrors from "~/components/validation-errors/ValidationErrors";
import SingleMessage from "./single-message/SingleMessage";
import CustomPageLoader from "~/components/custom-page-loader/CustomPageLoader";
import EmptySection from "~/components/empty-section/EmptySection";

// Types
import type { Route } from "./+types/CurrentConversation";
import type { ValidationErrorsType } from "~/types/ValidationErrorsType";

// Validators
import { CustomErrorBoundary } from "~/components/custom-error-boundary/CustomErrorBoundary";
import type { RootLoaderData } from "~/types/RootLoaderData";
import { checkForValidationErrors } from "~/utils/checkForValidationErrors";
import { Suspense, useState } from "react";
import { validateGroupUpdate } from "~/validators/validateGroupUpdate";
import groupsModel from "~/db/groups.model";
import ConversationInfo from "./conversation-info/ConversationInfo";
import { validateGroupParticipantDeletion } from "~/validators/validateGroupParticipantDeletion";
import { validateGroupParticipantRoleUpdate } from "~/validators/validateGroupParticipantRoleUpdate";
import { deleteFolderFromSupabaseBucket } from "~/supabase/deleteBucketFolder";
import { supabaseAdmin } from "~/supabase/supabase.server";
import { validateConversationById } from "~/validators/validateConversationById";

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

    // const conversationPromise = new Promise((r) => {
    //     setTimeout(() => {
    //         r(conversationsModel.getConversationById(userId, conversationId));
    //     }, 3000);
    // });

    const conversationPromise = conversationsModel.getConversationById(
        userId,
        conversationId,
    );

    return { conversationPromise };
}

const validIntents = [
    "send-message",
    "leave-group",
    "edit-group",
    "remove-user",
    "update-participant-role",
    "upload-profile-picture",
] as const;

type ValidIntent = (typeof validIntents)[number];

type FormValues = {
    intent: ValidIntent;
    message: string;
    conversationId: string;
    profilePictureUrl: string;
    title: string;
    description: string;
    participantId: string;
    role: "ADMIN" | "USER";
    file: File;
};

export async function action({ request, params }: Route.ActionArgs) {
    await new Promise((r) => setTimeout(r, 3000));
    const session = await getSession(request.headers.get("Cookie"));
    const loggedUserId = session.get("userId");

    if (!loggedUserId) {
        throw new Response("Not logged.", {
            status: 401,
            statusText: "User not logged.",
        });
    }

    const { id: conversationId } = params;

    const cId = Number(conversationId);
    const uId = Number(loggedUserId);

    const validateConversation = await validateConversationById(cId, uId);

    if (!validateConversation.success) {
        return {
            success: false,
            message: "Conversation errors.",
            errors: validateConversation.error.issues,
        };
    }

    const formData = await request.formData();
    const values = Object.fromEntries(formData) as FormValues;

    const intentValidation = z
        .object({
            intent: z.enum(validIntents),
        })
        .safeParse({ intent: values.intent });

    if (!intentValidation.success) {
        return {
            success: false,
            message: "Invalid intent value.",
            errors: intentValidation.error.issues,
        };
    }

    switch (values.intent) {
        case "send-message": {
            const validation = validateMessageInConversation({
                message: values.message,
            });

            if (!validation.success) {
                return {
                    success: false,
                    message: "Error while sending your message.",
                    errors: validation.error.issues,
                };
            }

            const message = await messagesModel.create(
                conversationId,
                values.message,
                loggedUserId,
            );

            return {
                success: true,
                message,
            };
        }

        case "edit-group": {
            const { profilePictureUrl, title, description } = values;

            if (!profilePictureUrl && !title && !description) {
                return {
                    success: false,
                    message: "Invalid field to update.",
                    errors: [
                        {
                            message:
                                "You should provide a profile picture, title or description field.",
                        },
                    ],
                };
            }

            const validation = profilePictureUrl
                ? await validateGroupUpdate.profilePicture(profilePictureUrl)
                : title
                  ? validateGroupUpdate.title(title)
                  : validateGroupUpdate.description(description);

            if (!validation.success) {
                return {
                    success: false,
                    message: "Group update failed.",
                    errors: validation.error.issues,
                };
            }

            const field = profilePictureUrl
                ? "profilePicture"
                : title
                  ? "title"
                  : "description";

            const value = profilePictureUrl || title || description;

            await groupsModel.updateGroup(Number(conversationId), field, value);

            return {
                success: true,
                message: "Group updated!",
            };
        }

        case "remove-user": {
            const { participantId } = values;
            const pId = Number(participantId);
            const cId = Number(conversationId);
            const luId = Number(loggedUserId);

            const validation = await validateGroupParticipantDeletion(
                pId,
                cId,
                luId,
            );

            if (!validation.success) {
                return {
                    success: false,
                    message: "Not able to remove participant.",
                    errors: validation.error.issues,
                };
            }

            await groupsModel.removeParticipantFromGroup(
                validation.data.participantId,
                validation.data.conversationId,
            );

            return {
                success: true,
                message: "Participant removed.",
            };
        }

        case "update-participant-role": {
            const { participantId } = values;
            const pId = Number(participantId);
            const cId = Number(conversationId);
            const luId = Number(loggedUserId);

            const validation = await validateGroupParticipantRoleUpdate(
                pId,
                cId,
                luId,
                values.role,
            );

            if (!validation.success) {
                return {
                    success: false,
                    message: "Unable to update participant's role.",
                    errors: validation.error.issues,
                };
            }

            await groupsModel.updateGroupParticipanRole(
                validation.data.conversationId,
                validation.data.participantId,
                validation.data.role,
            );

            return {
                success: true,
                message: "Participant role updated.",
            };
        }

        case "upload-profile-picture": {
            const errorMessage = "Profile picture update failed.";
            const file = formData.get("file") as File;

            const validation =
                await validateGroupUpdate.uploadProfilePicture(file);

            if (!validation.success) {
                return {
                    success: false,
                    message: "Profile picture update failed.",
                    errors: validation.error.issues,
                };
            }

            try {
                const folderPath = `${conversationId}`;
                await deleteFolderFromSupabaseBucket(
                    "group_profile_pictures",
                    folderPath,
                );
            } catch (error: any) {
                console.error(
                    "Error while trying to delete Supabase's group folder.",
                );
                return {
                    success: false,
                    message: errorMessage,
                };
            }

            const filePath = `${conversationId}/${Date.now()}-${validation.data.file.sanitizedName}`;

            const { data: uploadData, error: uploadError } =
                await supabaseAdmin.storage
                    .from("group_profile_pictures")
                    .upload(filePath, file);

            if (uploadError) {
                console.error(
                    "Error while uploading profile picture to Supabase's group_profile_pictures bucket.",
                );

                return {
                    success: false,
                    message: errorMessage,
                };
            }

            const { data } = supabaseAdmin.storage
                .from("group_profile_pictures")
                .getPublicUrl(uploadData.path);

            const cId = validateConversation.data.conversationId;

            await groupsModel.updateGroup(
                cId,
                "profilePicture",
                data.publicUrl,
            );

            return {
                success: true,
                message: "Profile picture updated!",
            };
        }
    }
}

export default function CurrentConversation({
    loaderData,
    params,
}: Route.ComponentProps) {
    const { id: conversationId } = params;
    const { user: rootData } = useRouteLoaderData("root") as RootLoaderData;
    const { conversationPromise } = loaderData;

    const [showInfo, setShowInfo] = useState(false);

    function toggleInfoSection() {
        setShowInfo((prev) => !prev);
    }

    const fetcher = useFetcher<ValidationErrorsType>();

    const showValidationErrors = checkForValidationErrors(fetcher);

    // Notifications //FIX: Handle the loading properly.
    const isSendingMessage = fetcher.state !== "idle";

    return (
        <Suspense
            key={conversationId}
            fallback={<CustomPageLoader message="Loading conversation..." />}
        >
            <Await resolve={conversationPromise}>
                {(conversation) => {
                    if (!conversation) {
                        return (
                            <EmptySection
                                message="No conversation"
                                icon="error_med"
                            />
                        );
                    }

                    const isGroup = conversation?.isGroup;

                    const userB = conversation?.participants.find(
                        (p) => p.userId !== rootData!.id,
                    )?.user;

                    const name = userB
                        ? `${userB.firstName} ${userB.lastName}`
                        : null;

                    const username = userB ? userB.username : null;

                    const title = isGroup ? conversation.title : name;

                    const ppf = isGroup
                        ? conversation.profilePicture
                        : userB?.profilePictureUrl;

                    const messages = conversation?.messages;

                    const toLink = userB ? `/users/${userB.username}` : "";

                    return (
                        <section
                            className={`
                            ${styles.currentConversation}
                            ${showInfo ? styles.infoVisible : styles.infoHidden}
                            `}
                        >
                            {showValidationErrors ? (
                                <ValidationErrors
                                    roundBorders={false}
                                    className={styles.validationErrors}
                                    errors={fetcher.data!.errors}
                                    title={fetcher.data!.message}
                                />
                            ) : null}
                            <title>
                                {isGroup
                                    ? `${title} group conversation | Chateá!`
                                    : `Conversation with ${title} | Chateá!`}
                            </title>
                            <header className={`${styles.header}`}>
                                <NavLink
                                    title="Go to this user's profile"
                                    className={`
                                        ${styles.userInfo}
                                        ${isGroup ? classes.disabledLink : ""}
                                        ${isGroup ? classes.flexRowStartCenter : ""}
                                        `}
                                    to={isGroup ? "/groups" : toLink}
                                >
                                    <img
                                        src={ppf || avatar}
                                        alt={title || "Profile picture"}
                                        className={`${classes.profilePictureRound} ${styles.headerPpf}`}
                                    />
                                    <div className={styles.names}>
                                        <h1 className={styles.title}>
                                            {title}
                                        </h1>
                                        {isGroup ? null : (
                                            <p className={styles.username}>
                                                @{username}
                                            </p>
                                        )}
                                    </div>
                                </NavLink>
                                <button
                                    className={`${styles.toggleConversationInfoButton} ${classes.flexRowStartCenter} ${classes.noBorderNoOutline}`}
                                    onClick={toggleInfoSection}
                                >
                                    <span className={styles.text}>
                                        {showInfo ? "Hide" : "Show"}{" "}
                                        conversation info
                                    </span>
                                    <span
                                        className={`${classes.defaultIcon} ${styles.icon} ${showInfo ? styles.infoOpen : styles.infoClosed} material-symbols-rounded`}
                                    >
                                        chip_extraction
                                    </span>
                                </button>
                            </header>
                            {messages?.length === 0 || !messages ? (
                                <EmptySection
                                    className={styles.emptyMessages}
                                    message="No messages in this conversation."
                                    icon="chat_dashed"
                                    linkPath="/"
                                />
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
                            {isSendingMessage ? (
                                <div className={styles.messageLoader}>
                                    <p className={styles.message}>
                                        Sending message...
                                    </p>
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
                                        type="hidden"
                                        name="intent"
                                        value="send-message"
                                    />
                                    <input
                                        className={styles.input}
                                        type="text"
                                        name="message"
                                        id="message"
                                        placeholder={`Hello ${isGroup ? "Guys" : userB ? userB.firstName : ""}, how are you doing today?`}
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
                            {showInfo ? (
                                <ConversationInfo
                                    className={styles.conversationInfo}
                                    fetcher={fetcher}
                                    conversation={conversation}
                                />
                            ) : null}
                        </section>
                    );
                }}
            </Await>
        </Suspense>
    );
}

export const ErrorBoundary = CustomErrorBoundary;
