import * as z from "zod";
import { checkIfUrlPointsToImage } from "./custom-validators/checkIfUrlPointsToImage";

export default async function validateUserUpdate(
    userId: number,
    profilePictureUrl: string,
) {
    return await z
        .object({
            userId: z.number(),
            profilePictureUrl: z
                .string()
                .min(1, "Profile picture URL field can't be empty")
                .refine(async (url) => {
                    const isImage = await checkIfUrlPointsToImage(url);

                    if (!isImage) {
                        return false;
                    }

                    return true;
                }, "The URL is not a valid image link."),
        })
        .safeParseAsync({ userId, profilePictureUrl });
}
