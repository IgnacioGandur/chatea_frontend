import * as z from "zod";
import checkIfUsernameIsAvailable from "./custom-validators/checkIfUsernameIsAvailable";

const regex = /^[\w.-]{3,30}$/;
const usernameLengthMessage = "Username should be between 3 and 30 characters.";
const passwordLengthMessage = "Password should be at least 3 characters.";

const validateUserRegister = z
    .object({
        username: z
            .string()
            .regex(
                regex,
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
