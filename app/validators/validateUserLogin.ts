import * as z from "zod";
import userModel from "~/db/user";
import bcrypt from "bcryptjs";

const minLengthMessage = "Username field can't be empty.";

const validateUserLogin = z
    .object({
        username: z.string().min(1, minLengthMessage),
        password: z.string(),
    })
    .superRefine(async (data, ctx) => {
        const { username, password } = data;

        const user = await userModel.get(username);

        if (!user) {
            ctx.addIssue({
                code: "custom",
                path: ["username"],
                message: "User doesn't exist.",
            });
            return;
        }

        const passwordsMatch = await bcrypt.compare(password, user?.password);

        if (!passwordsMatch) {
            ctx.addIssue({
                code: "custom",
                path: ["password"],
                message: "The password is not correct.",
            });
        }
    });

export default validateUserLogin;
