import * as z from "zod";

export default async function validatePasswordUpdate(
    password: string,
    confirmPassword: string,
) {
    return await z
        .object({
            password: z.string(),
            confirmPassword: z.string(),
        })
        .superRefine((data, ctx) => {
            const { password, confirmPassword } = data;
            if (password !== confirmPassword) {
                ctx.addIssue({
                    code: "custom",
                    path: ["password"],
                    message: "The passwords don't match.",
                });
            }
        })
        .safeParseAsync({ password, confirmPassword });
}
