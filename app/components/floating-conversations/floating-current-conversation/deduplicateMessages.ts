import type { MessageWithAttachmentsAndSenderOmitPassword } from "~/db/message.types";

export default function deduplicateMessages(
    previousMessages: MessageWithAttachmentsAndSenderOmitPassword[],
    newMessages: MessageWithAttachmentsAndSenderOmitPassword[],
): MessageWithAttachmentsAndSenderOmitPassword[] {
    const messagesMap = new Map<
        number,
        MessageWithAttachmentsAndSenderOmitPassword
    >();

    for (const message of previousMessages) {
        messagesMap.set(message.id, message);
    }

    for (const message of newMessages) {
        messagesMap.set(message.id, message);
    }

    return Array.from(messagesMap.values()).sort((a, b) => {
        return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    });
}
