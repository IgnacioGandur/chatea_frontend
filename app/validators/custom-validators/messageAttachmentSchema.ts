import * as z from "zod";
import { sanitizeFilename } from "./sanitizeFilename";

export const messageAttachmentSchema = z
    .instanceof(File, { error: "Attachment must be a file." })
    .refine((file) => file.size > 0, "Attachment can't be empty.")
    .refine(
        (file) => file.size < 3 * 1024 * 1024,
        "Attachment should be less than 3MB.",
    )
    .transform((file) => ({ filename: sanitizeFilename(file.name) }));
