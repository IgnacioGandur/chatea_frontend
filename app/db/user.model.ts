import prisma from "./prisma";
import {
    PrismaClient,
    type User as UserType,
} from "../../generated/prisma/client";
import type { UserProfileStats } from "./user.types";

class User {
    prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async create(
        firstName: string,
        lastName: string,
        username: string,
        password: string,
    ): Promise<UserType> {
        const profilePictureUrl = `https://ui-avatars.com/api/?background=random&name=${firstName}+${lastName}`;

        return await this.prisma.user.create({
            data: {
                profilePictureUrl,
                firstName,
                lastName,
                username,
                password,
            },
        });
    }

    async get(username: string): Promise<UserType | null> {
        return await this.prisma.user.findUnique({
            where: {
                username,
            },
        });
    }

    async getById(
        id: number | string,
        omitPassword: boolean,
    ): Promise<UserType | null> {
        return await this.prisma.user.findUnique({
            where: {
                id: Number(id),
            },
            omit: {
                password: omitPassword,
            },
        });
    }

    async getAll(): Promise<Omit<UserType, "password">[]> {
        return await this.prisma.user.findMany({
            omit: {
                password: true,
            },
        });
    }

    async getUserProfileStats(id: number): UserProfileStats {
        const [
            user,
            sentMessagesCount,
            friendshipsCount,
            totalConversationsCount,
            privateConversationsCount,
            groupConversationsCount,
            ownedGroupsCount,
        ] = await this.prisma.$transaction([
            this.prisma.user.findUnique({
                where: {
                    id,
                },
            }),
            this.prisma.message.count({
                where: {
                    senderId: id,
                },
            }),
            this.prisma.friendship.count({
                where: {
                    status: "ACCEPTED",
                    OR: [{ userAId: id }, { userBId: id }],
                },
            }),
            this.prisma.conversation.count({
                where: {
                    participants: {
                        some: {
                            userId: id,
                        },
                    },
                },
            }),
            this.prisma.conversation.count({
                where: {
                    isGroup: false,
                    participants: {
                        some: {
                            userId: id,
                        },
                    },
                },
            }),
            this.prisma.conversation.count({
                where: {
                    isGroup: true,
                    participants: {
                        some: {
                            userId: id,
                        },
                    },
                },
            }),
            this.prisma.conversation.count({
                where: {
                    isGroup: true,
                    ownerId: id,
                },
            }),
        ]);

        return {
            user,
            sentMessagesCount,
            friendshipsCount,
            totalConversationsCount,
            privateConversationsCount,
            groupConversationsCount,
            ownedGroupsCount,
        };
    }

    async updateUser(
        id: number,
        field: "profilePictureUrl" | "password",
        value: string,
    ): Promise<UserType> {
        return await this.prisma.user.update({
            where: {
                id,
            },
            data: {
                [field]: value,
            },
        });
    }
}

export default new User(prisma);
