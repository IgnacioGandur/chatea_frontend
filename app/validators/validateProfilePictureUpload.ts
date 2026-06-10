import * as z from "zod";
import { imageFileSchema } from "./custom-validators/validateImageFile";

export async function validateProfilePictureUpload(
    loggedUserId: number,
    file: File,
) {
    return await z
        .object({
            loggedUserId: z.number(),
            file: imageFileSchema,
        })
        .safeParseAsync({ loggedUserId, file });
}
