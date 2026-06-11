import * as z from "zod";
import { messageAttachmentSchema } from "./custom-validators/messageAttachmentSchema";

export async function validateMessageAttachment(file: File) {
    return await z
        .object({ file: messageAttachmentSchema })
        .safeParseAsync({ file });
}
