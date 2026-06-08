import {
    includeParticipants,
    includeParticipantsWithUser,
} from "./groups.includes";
import type {
    GroupConversationWithParticipantsAndUser,
    GroupWithParticipants,
} from "./groups.types";
import prisma from "./prisma";
import type {
    Conversation,
    Participant,
    PrismaClient,
} from "~/../generated/prisma/client";

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
        const profilePicture = `https://ui-avatars.com/api/?background=random&name=${title.replaceAll(" ", "+")}`;

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

    async updateGroup(
        conversationId: number,
        field: "profilePicture" | "title" | "description",
        value: string,
    ) {
        await this.prisma.conversation.update({
            where: {
                id: conversationId,
            },
            data: {
                [field]: value,
            },
        });
    }

    async removeParticipantFromGroup(
        participantId: number,
        conversationId: number,
    ): Promise<void> {
        await this.prisma.participant.delete({
            where: {
                userId_conversationId: {
                    conversationId,
                    userId: participantId,
                },
            },
        });
    }

    async getGroupParticipant(
        participantId: number,
        conversationId: number,
    ): Promise<Participant | null> {
        return await this.prisma.participant.findUnique({
            where: {
                userId_conversationId: {
                    userId: participantId,
                    conversationId,
                },
            },
        });
    }

    async getGroupParticipants(conversationId: number): Promise<Participant[]> {
        return await this.prisma.participant.findMany({
            where: {
                conversationId,
            },
        });
    }

    async updateGroupParticipanRole(
        conversationId: number,
        participantId: number,
        role: "USER" | "ADMIN",
    ): Promise<void> {
        await this.prisma.participant.update({
            where: {
                userId_conversationId: {
                    userId: participantId,
                    conversationId,
                },
            },
            data: {
                role,
            },
        });
    }
}

export default new Group(prisma);
