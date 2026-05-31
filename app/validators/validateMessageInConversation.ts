import * as z from "zod";

const validateMessageInConversation = z.object({
    message: z.string().min(1, "Message can't be empty."),
});

export default validateMessageInConversation;
