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
import CustomPageLoader from "~/components/custom-page-loader/CustomPageLoader";
import EmptySection from "~/components/empty-section/EmptySection";

// Types
import type { Route } from "./+types/CurrentConversation";

// Validators
import { CustomErrorBoundary } from "~/components/custom-error-boundary/CustomErrorBoundary";
import type { RootLoaderData } from "~/types/RootLoaderData";
import { checkForValidationErrors } from "~/utils/checkForValidationErrors";
import { Suspense, useEffect, useRef, useState } from "react";
import { validateGroupUpdate } from "~/validators/validateGroupUpdate";
import groupsModel from "~/db/groups.model";
import ConversationInfo from "./conversation-info/ConversationInfo";
import { validateGroupParticipantDeletion } from "~/validators/validateGroupParticipantDeletion";
import { validateGroupParticipantRoleUpdate } from "~/validators/validateGroupParticipantRoleUpdate";
import { deleteFolderFromSupabaseBucket } from "~/supabase/deleteBucketFolder";
import { supabaseAdmin } from "~/supabase/supabase.server";
import { validateConversationById } from "~/validators/validateConversationById";
import { validateMessageAttachment } from "~/validators/validateMessageAttachment";
import { uploadConversationAttachment } from "~/supabase/uploadConversationAttachment";
import messageModel from "~/db/message.model";
import { validateGroupMessageDeletion } from "~/validators/validateGroupMessageDeletion";
import { validateOwnMessageDeletion } from "~/validators/validateOwnMessageDeletion";
import { useFetcherToast } from "~/hooks/useFetcherToast";
import type { Message } from "../../../../../generated/prisma/client";
import ConversationMessages from "./conversation-messages/ConversationMessages";
import type { ValidationErrorsType } from "~/types/ValidationErrorsType";

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

    const conversationPromise = conversationsModel.getConversationById(
        userId,
        conversationId,
        10,
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
    "delete-group-message",
    "delete-own-message",
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
    messageId: string;
    senderId: string;
};

export async function action({ request, params }: Route.ActionArgs) {
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
        // TODO: Remove this switch case because messages are being sent through the api endpoint: '/api/conversations/id/messages'.

        case "send-message": {
            console.log("Message sent through the route's action function.");

            return {
                success: false,
                message: "Not sent.",
            };

            const file = formData.get("file") as File;
            const { message } = values;

            const hasFile = file && file.size > 0 && file.name !== "";

            const validateMessage = validateMessageInConversation({
                message,
            });

            if (!validateMessage.success) {
                return {
                    success: false,
                    message: "Error while sending your message.",
                    errors: validateMessage.error.issues,
                };
            }

            if (hasFile) {
                const attachmentValidation =
                    await validateMessageAttachment(file);

                if (!attachmentValidation.success) {
                    return {
                        success: false,
                        message: "Unable to send attachment.",
                        errors: attachmentValidation.error.issues,
                    };
                }

                try {
                    const {
                        data: {
                            file: { filename },
                        },
                    } = attachmentValidation;

                    const {
                        data: { conversationId: cId, loggedUserId: uId },
                    } = validateConversation;

                    const supabaseFilename = `${cId}/${uId}-${Date.now()}-${filename}`;

                    const attachmentUrl = await uploadConversationAttachment(
                        "conversation_attachments",
                        supabaseFilename,
                        file,
                    );

                    await messageModel.createWithAttachment(
                        validateConversation.data.conversationId,
                        validateMessage.data.message,
                        validateConversation.data.loggedUserId,
                        filename,
                        attachmentUrl,
                        file.type,
                    );

                    return {
                        success: true,
                    };
                } catch (error: any) {
                    console.error(
                        "Supabase error. File upload failed: ",
                        error,
                    );
                    return {
                        success: false,
                        message: "We were unable to send your attachment.",
                    };
                }
            }

            await messagesModel.create(
                conversationId,
                values.message,
                loggedUserId,
            );

            return {
                success: true,
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

        case "delete-group-message": {
            const { messageId, senderId } = values;
            const sId = Number(senderId);
            const mId = Number(messageId);

            const validation = await validateGroupMessageDeletion(
                sId,
                cId,
                mId,
                uId,
            );

            if (!validation.success) {
                return {
                    success: false,
                    message: "Group message deletion failed:",
                    errors: validation.error.issues,
                };
            }

            await messageModel.deleteById(validation.data.messageId);

            return {
                success: true,
                message: "Message deleted!",
            };
        }

        case "delete-own-message": {
            const { messageId } = values;
            const mId = Number(messageId);
            const luId = Number(loggedUserId);

            const validation = await validateOwnMessageDeletion(mId, luId);

            if (!validation.success) {
                return {
                    success: false,
                    message: "Unable to delete your message:",
                    errors: validation.error.issues,
                    messageId: mId,
                };
            }

            await messageModel.deleteById(mId);

            return {
                success: true,
                message: "Message deleted!",
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

    const fetcher = useFetcher({ key: "current-conversation" });
    const sendMessageFetcher = useFetcher<{
        success: boolean;
        createdMessage: Message;
    }>({ key: "send-message" });

    const showValidationErrors = checkForValidationErrors(fetcher);

    // const isNotIdle = fetcher.state !== "idle";
    const currentIntent = fetcher.formData?.get("intent");

    const setToastData = useFetcherToast(fetcher);

    useEffect(() => {
        const isDeletingMessage =
            currentIntent === "delete-message" ||
            currentIntent === "delete-group-message";

        if (isDeletingMessage) {
            setToastData({
                failMessage: "Message deletiong failed.",
                loadingMessage: "Deleting message...",
                toastId: "delete-message",
            });
        }
    }, [fetcher.data]);

    // Clear the message input fields after the user sends a message.
    const sendMessageFormRef = useRef<HTMLFormElement | null>(null);

    useEffect(() => {
        if (
            sendMessageFormRef.current &&
            sendMessageFetcher.state === "submitting"
        ) {
            sendMessageFormRef.current.reset();
        }
    }, [sendMessageFetcher.data]);
    // ==============================================================

    // If the message fails due to validation reasons, show the errors this
    // way since I'm not using react router's fetcher.
    const [sendMessageValidationErrors, setSendMessageValidationErrors] =
        useState<ValidationErrorsType | null>(null);

    useEffect(() => {
        function handleSendMessageErrors(event: Event) {
            const customEvent = event as CustomEvent<ValidationErrorsType>;
            setSendMessageValidationErrors(customEvent.detail || null);
        }

        window.addEventListener("chat:send-message", handleSendMessageErrors);

        return () =>
            window.removeEventListener(
                "chat:send-message",
                handleSendMessageErrors,
            );
    }, []);
    // ==============================================================

    return (
        <Suspense
            key={conversationId}
            fallback={<CustomPageLoader message="Loading conversation..." />}
        >
            <Await resolve={conversationPromise}>
                {(promise) => {
                    const conversation = promise?.conversation;

                    if (!conversation) {
                        return (
                            <EmptySection
                                message="No conversation"
                                icon="error_med"
                            />
                        );
                    }

                    const isGroup = conversation?.isGroup;
                    const participants = conversation.participants;

                    // User B info
                    const userB = conversation?.participants.find(
                        (p) => p.userId !== rootData!.id,
                    )?.user;

                    const userBName = userB
                        ? `${userB.firstName} ${userB.lastName}`
                        : null;

                    const userBUsername = userB ? userB.username : null;

                    const userBProfilePicture = isGroup
                        ? conversation.profilePicture
                        : userB?.profilePictureUrl;

                    const userBProfileLink = userB
                        ? `/users/${userB.username}`
                        : "";

                    const headerTitle = isGroup
                        ? conversation.title
                        : userBName;

                    return (
                        <section
                            className={`
                            ${styles.currentConversation}
                            ${showInfo ? styles.infoVisible : styles.infoHidden}
                            `}
                        >
                            {sendMessageValidationErrors ? (
                                <ValidationErrors
                                    roundBorders={false}
                                    className={styles.validationErrors}
                                    errors={sendMessageValidationErrors.errors}
                                    title={sendMessageValidationErrors.message}
                                />
                            ) : null}
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
                                    ? `${headerTitle} group conversation | Chateá!`
                                    : `Conversation with ${headerTitle} | Chateá!`}
                            </title>
                            <header className={`${styles.header}`}>
                                <NavLink
                                    title="Go to this user's profile"
                                    className={`
                                        ${styles.userInfo}
                                        ${isGroup ? classes.disabledLink : ""}
                                        ${isGroup ? classes.flexRowStartCenter : ""}
                                        `}
                                    to={isGroup ? "/groups" : userBProfileLink}
                                >
                                    <img
                                        src={userBProfilePicture || avatar}
                                        alt={headerTitle || "Profile picture"}
                                        className={`${classes.profilePictureRound} ${styles.headerPpf}`}
                                    />
                                    <div className={styles.names}>
                                        <h1 className={styles.title}>
                                            {headerTitle}
                                        </h1>
                                        {isGroup ? null : (
                                            <p className={styles.username}>
                                                @{userBUsername}
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
                            <ConversationMessages
                                initialData={{
                                    messages: conversation.messages,
                                    hasMoreMessages: promise.hasMoreMessages,
                                    nextCursor: promise.nextCursor,
                                }}
                                conversationParticipants={participants}
                                conversationIsGroup={isGroup}
                            />
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

// <MessagesList
//     initialData={{
//         messages: conversation.messages,
//         hasMoreMessages: promise.hasMoreMessages,
//         nextCursor: promise.nextCursor,
//     }}
// />
// <sendMessageFetcher.Form
//     ref={sendMessageFormRef}
//     encType="multipart/form-data"
//     className={styles.sendMessageForm}
//     method="post"
//     action={`/api/conversations/${conversationId}/messages`}
// >
//     <input
//         type="hidden"
//         name="temporaryId"
//         value={temporaryId}
//     />
//     <input
//         type="file"
//         name="file"
//     />
//     <input
//         type="hidden"
//         name="intent"
//         value="send-message"
//     />
//     <input
//         className={styles.input}
//         type="text"
//         name="message"
//         id="message"
//         placeholder={`Hello ${isGroup ? "Guys" : userB ? userB.firstName : ""}, how are you doing today?`}
//     />
//     <button
//         id="send-message-button"
//         title="Send your message!"
//         className={styles.sendMessageButton}
//         type="submit"
//     >
//         <span
//             className={`material-symbols-rounded ${styles.icon}`}
//         >
//             arrow_warm_up
//         </span>
//     </button>
// </sendMessageFetcher.Form>
