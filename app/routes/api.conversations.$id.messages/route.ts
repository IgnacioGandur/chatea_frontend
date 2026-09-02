import messagesModel from "~/db/message.model";
import type { Route } from "./+types/route";
import { getLoggedUserId } from "~/utils/getLoggedUserId";
import validateMessageInConversation from "~/validators/validateMessageInConversation";
import { validateMessageAttachment } from "~/validators/validateMessageAttachment";
import { uploadConversationAttachment } from "~/supabase/uploadConversationAttachment";

export async function loader({ params, request, url }: Route.LoaderArgs) {
    const cursorId = Number(url.searchParams.get("cursor"));
    const cId = Number(params.id); // Conversation id.

    if (!cursorId || !cId) {
        console.error(
            "You need to provide a cursor ID and a conversation ID to load more messages.",
        );
        return;
    }

    const { loggedUserId } = await getLoggedUserId(request);
    const uId = Number(loggedUserId);

    const data = await messagesModel.loadMoreMessages(cId, uId, cursorId, 10);

    return data;
}

type FormValues = {
    message: string;
    file: File;
    temporaryId: string;
};

export async function action({ request, params }: Route.ActionArgs) {
    const { loggedUserId } = await getLoggedUserId(request);
    const { id: conversationId } = params;
    const uId = Number(loggedUserId);
    const cId = Number(conversationId);
    const formData = await request.formData();
    const values = Object.fromEntries(formData) as FormValues;
    const { message } = values;
    const file = formData.get("file") as File;
    const temporaryId = formData.get("temporaryId") as string;

    const hasFile = file && file.size > 0 && file.name !== "";

    const validateMessage = validateMessageInConversation({ message });

    if (!validateMessage.success) {
        return {
            success: false,
            message: "Error while sending your message: ",
            errors: validateMessage.error.issues,
        };
    }

    if (hasFile) {
        const attachmentValidation = await validateMessageAttachment(file);

        console.log(
            "The content of attachmentValidation is: ",
            attachmentValidation,
        );

        if (!attachmentValidation.success) {
            return {
                success: false,
                message: "Unable to send message with attachment: ",
                errors: attachmentValidation.error.issues,
            };
        }

        try {
            const {
                data: {
                    file: { filename },
                },
            } = attachmentValidation;

            const supabaseFilename = `${cId}/${uId}-${Date.now()}-${filename}`;

            const attachmentUrl = await uploadConversationAttachment(
                "conversation_attachments",
                supabaseFilename,
                file,
            );

            const createdMessage = await messagesModel.createWithAttachment(
                cId,
                validateMessage.data.message,
                uId,
                filename,
                attachmentUrl,
                file.type,
            );

            return {
                success: true,
                createdMessage,
                temporaryId,
            };
        } catch (error: any) {
            console.error("Supabase error. File upload file: ", error);
            return {
                success: false,
                message: "We were unable to send your attachment.",
            };
        }
    }

    const createdMessage = await messagesModel.create(
        cId,
        validateMessage.data.message,
        uId,
    );

    return {
        success: true,
        message: "Message created!",
        createdMessage,
        temporaryId,
    };
}
