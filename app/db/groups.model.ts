import {
    includeParticipantsWithUser,
    includeParticipantsOmitPassword,
} from "./groups.includes";
import type {
    GroupByIdIncludeParticipantsOmitPassword,
    GroupConversation,
    GroupsPage,
} from "./groups.types";
import prisma from "./prisma";
import type {
    Conversation,
    Participant,
    PrismaClient,
} from "~/../generated/prisma/client";
import type { GroupFilter } from "./groupFilters";

const pageSize = 10;

class Group {
    prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async getGroupsPage(cursor?: number, search?: string): Promise<GroupsPage>;
    async getGroupsPage(
        cursor: number | undefined,
        search: string | undefined,
        filter: GroupFilter,
        loggedUserIs: number,
    ): Promise<GroupsPage>;
    async getGroupsPage(
        cursor?: number,
        search?: string,
        filter?: string,
        loggedUserId?: number,
    ): Promise<GroupsPage> {
        if (filter && !loggedUserId) {
            throw new Error(
                `"loggedUserId" is required when filter is provided.`,
            );
        }

        const term = search?.trim();

        const query = await this.prisma.conversation.findMany({
            where: {
                isGroup: true,
                description: { not: null },
                profilePicture: { not: null },
                title: term
                    ? {
                          contains: term,
                          mode: "insensitive",
                      }
                    : { not: null },
                ...(filter === "joined-groups"
                    ? {
                          participants: {
                              some: {
                                  userId: loggedUserId,
                                  role: {
                                      not: "OWNER",
                                  },
                              },
                          },
                      }
                    : filter === "owned-groups"
                      ? {
                            participants: {
                                some: {
                                    userId: loggedUserId,
                                    role: "OWNER",
                                },
                            },
                        }
                      : null),
            },
            take: pageSize + 1,
            ...(cursor !== undefined && {
                cursor: {
                    id: cursor,
                },
                skip: 1,
            }),
            orderBy: {
                ...(filter === "asc" || filter === "desc"
                    ? {
                          createdAt: filter,
                      }
                    : {
                          id: "desc",
                      }),
            },
            include: includeParticipantsWithUser,
        });

        const hasMoreGroups = query.length > pageSize;
        const page = hasMoreGroups ? query.slice(0, pageSize) : query;

        return {
            groups: page as GroupConversation[],
            nextCursor: hasMoreGroups ? page[page.length - 1].id : null,
        };
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
    ): Promise<GroupByIdIncludeParticipantsOmitPassword | null> {
        return await this.prisma.conversation.findUnique({
            where: {
                id: Number(groupId),
            },
            include: includeParticipantsOmitPassword,
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
