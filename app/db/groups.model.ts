import {
    includeParticipants,
    includeParticipantsWithUser,
} from "./groups.includes";
import type {
    GroupConversationWithParticipantsAndUser,
    GroupWithParticipants,
} from "./groups.types";
import prisma from "./prisma";
import type { Conversation, PrismaClient } from "~/../generated/prisma/client";

class Group {
    prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async getAll(): Promise<GroupConversationWithParticipantsAndUser[]> {
        const groups = await this.prisma.conversation.findMany({
            where: {
                isGroup: true,
                title: { not: null },
                description: { not: null },
                profilePicture: { not: null },
            },
            include: includeParticipantsWithUser,
        });

        return groups as unknown as GroupConversationWithParticipantsAndUser[];
    }

    async create(
        title: string,
        description: string,
        ownerId: string | number,
    ): Promise<Conversation> {
        const profilePicture = `https://ui-avatars.com/api/?background=random&name=${title}`;

        return await this.prisma.conversation.create({
            data: {
                isGroup: true,
                title,
                profilePicture,
                description,
                ownerId: Number(ownerId),
                participants: {
                    create: {
                        userId: Number(ownerId),
                        role: "OWNER",
                    },
                },
            },
        });
    }

    async getGroupByIdWithParticipants(
        groupId: number | string,
    ): Promise<GroupWithParticipants | null> {
        return await this.prisma.conversation.findUnique({
            where: {
                id: Number(groupId),
            },
            include: includeParticipants,
        });
    }

    async addParticipantToGroup(
        conversationId: number,
        userId: number,
    ): Promise<void> {
        await this.prisma.participant.create({
            data: {
                conversationId,
                userId,
                role: "USER",
            },
        });
    }

    async leaveGroup(conversationId: number, userId: number): Promise<void> {
        await this.prisma.participant.delete({
            where: {
                userId_conversationId: {
                    userId,
                    conversationId,
                },
            },
        });
    }
}

export default new Group(prisma);
