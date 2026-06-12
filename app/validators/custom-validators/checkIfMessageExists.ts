import messageModel from "~/db/message.model";

export async function checkIfMessageExists(
    messageId: number,
): Promise<boolean> {
    const message = await messageModel.getMessageById(messageId);
    return message ? true : false;
}
