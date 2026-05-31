import * as z from "zod";
import checkIfUserExistsById from "./custom-validators/checkIfUserExistsById";

const validateNewMessage = z.object({
    message: z.string().min(1, "The message can't be empty."),
    userAId: z
        .string()
        .refine(checkIfUserExistsById, "Message sender doesn't exist."),
    userBId: z
        .string()
        .refine(checkIfUserExistsById, "Message recipient doesn't exist."),
});

export default validateNewMessage;
