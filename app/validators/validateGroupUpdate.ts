import * as z from "zod";
import { checkIfUrlPointsToImage } from "./custom-validators/checkIfUrlPointsToImage";
import { imageFileSchema } from "./custom-validators/imageFileSchema";

function minLengthError(field: string, length: number): string {
    return length === 1
        ? `The field: '${field}' can't be empty.`
        : `Group ${field} should be at least ${length} characters long.`;
}

export const validateGroupUpdate = {
    title: (title: string) => {
        return z
            .object({
                title: z.string().min(3, minLengthError("title", 3)),
            })
            .safeParse({ title });
    },

    description: (description: string) => {
        return z
            .object({
                description: z
                    .string()
                    .min(3, minLengthError("description", 3)),
            })
            .safeParse({ description });
    },

    profilePicture: async (profilePicture: string) => {
        return z
            .object({
                profilePicture: z
                    .string()
                    .min(1, minLengthError("profile picture", 1))
                    .refine(
                        checkIfUrlPointsToImage,
                        "Invalid profile picture URL.",
                    ),
            })
            .safeParseAsync({ profilePicture });
    },

    uploadProfilePicture: async (file: File) => {
        return z
            .object({
                file: imageFileSchema,
            })
            .safeParseAsync({ file });
    },
};
