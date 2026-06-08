import * as z from "zod";

function validateMessageInConversation({ message }: { message: string }) {
    return z
        .object({
            message: z.string().min(1, "Message can't be empty."),
        })
        .safeParse({ message });
}

export default validateMessageInConversation;
