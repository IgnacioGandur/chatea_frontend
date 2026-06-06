import * as z from "zod";

export const validateGroupCreation = z.object({
    title: z
        .string("The group title should be a string.")
        .trim()
        .min(1, "The group title can't be empty."),
    description: z
        .string("The group description should be a string.")
        .trim()
        .min(1, "The group description can't be empty."),
});
