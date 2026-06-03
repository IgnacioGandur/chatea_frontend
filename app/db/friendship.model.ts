import type {
    PrismaClient,
    Friendship as FriendshipType,
} from "../../generated/prisma/client";
import type { FriendshipIncludeUserA } from "./friendship.types";
import prisma from "./prisma";

class Friendship {
    prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async create(
        userAId: number | string,
        userBId: number | string,
    ): Promise<FriendshipIncludeUserA> {
        const friendship = await this.prisma.friendship.create({
            data: {
                userAId: Number(userAId),
                userBId: Number(userBId),
            },
            include: {
                userA: true,
            },
        });

        return friendship;
    }

    async getUserFriendships(
        userId: number | string,
    ): Promise<FriendshipType[]> {
        const friendships = await this.prisma.friendship.findMany({
            where: {
                OR: [
                    {
                        userAId: Number(userId),
                    },
                    {
                        userBId: Number(userId),
                    },
                ],
            },
        });

        return friendships;
    }

    async cancelFriendshipRequest(friendshipId: number | string) {
        await this.prisma.friendship.delete({
            where: {
                id: Number(friendshipId),
            },
        });
    }

    async handleFriendshipRequest(
        response: "accept" | "reject",
        friendshipId?: number | string,
    ): Promise<string> {
        if (!response || !friendshipId) {
            console.error("Function call is missing argument.");
        }

        if (response === "accept") {
            await this.prisma.friendship.update({
                where: {
                    id: Number(friendshipId),
                },
                data: {
                    status: "ACCEPTED",
                },
            });

            return "Nice! You are now friends!";
        } else {
            await this.prisma.friendship.delete({
                where: {
                    id: Number(friendshipId),
                },
            });

            return "Friendship request rejected.";
        }
    }

    async getFriendshipBetweenUserIds(
        userAId: number | string,
        userBId: number | string,
    ): Promise<FriendshipType | null> {
        return await this.prisma.friendship.findFirst({
            where: {
                OR: [
                    {
                        userAId: Number(userAId),
                        userBId: Number(userBId),
                    },
                    {
                        userAId: Number(userBId),
                        userBId: Number(userAId),
                    },
                ],
            },
        });
    }

    async getFriendshipById(
        friendshipId: number | string,
    ): Promise<FriendshipType | null> {
        return await this.prisma.friendship.findUnique({
            where: {
                id: Number(friendshipId),
            },
        });
    }
}

export default new Friendship(prisma);
