import type {
    PrismaClient,
    Participant as ParticipantType,
} from "../../generated/prisma/client";
import prisma from "./prisma";

class Participant {
    prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async getParticipantByUserIdAndConversationId(
        userId: string | number,
        conversationId: number | string,
    ): Promise<ParticipantType | null> {
        return await this.prisma.participant.findUnique({
            where: {
                userId_conversationId: {
                    userId: Number(userId),
                    conversationId: Number(conversationId),
                },
            },
        });
    }
}

export default new Participant(prisma);
