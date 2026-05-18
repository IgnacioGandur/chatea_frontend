import * as z from "zod";
import checkIfUsernameIsAvailable from "./custom-validators/checkIfUsernameIsAvailable";

const usernameRegex = /^[\w.-]{3,30}$/;
const namesRegex = /^[\w]+$/;
const usernameLengthMessage = "Username should be between 3 and 30 characters.";
const passwordLengthMessage = "Password should be at least 3 characters.";
const firstNameLengthMessage =
    "First name must be between 3 and 30 characters.";
const lastNameLengthMessage = "Last name must be between 3 and 30 characters.";

const validateUserRegister = z
    .object({
        firstName: z
            .string()
            .regex(namesRegex, "First name can only contain letters.")
            .min(3, firstNameLengthMessage)
            .max(30, firstNameLengthMessage),
        lastName: z
            .string()
            .regex(namesRegex, "Last name can only contain letters.")
            .min(3, lastNameLengthMessage)
            .max(30, lastNameLengthMessage),
        username: z
            .string()
            .regex(
                usernameRegex,
                "Username can only contain letters, numbers, dots and hyphens.",
            )
            .min(3, usernameLengthMessage)
            .max(30, usernameLengthMessage)
            .refine(
                checkIfUsernameIsAvailable,
                "Username is already taken, please choose another one.",
            ),
        password: z.string().min(3, passwordLengthMessage),
        confirm: z.string(),
    })
    .refine((data) => data.password === data.confirm, {
        path: ["confirm"],
        message: "The password and the confirm password fields don't match.",
    });

export default validateUserRegister;
