import * as z from "zod";
import { sanitizeFilename } from "./sanitizeFilename";

export const imageFileSchema = z
    .instanceof(File, { error: "Upload should be a file." })
    .refine((file) => file.size > 0, {
        error: "File can't be empty.",
    })
    .refine((file) => file.size < 3 * 1024 * 1024, {
        error: "File should be less than 3MB.",
    })
    .refine((file) => file.type.startsWith("image/"), {
        error: "File should be of type image.",
    })
    .transform((file) => {
        return {
            blob: file,
            sanitizedName: sanitizeFilename(file.name),
        };
    });
