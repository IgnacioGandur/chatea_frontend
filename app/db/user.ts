import prisma from "./prisma";
import {
    PrismaClient,
    type User as UserType,
} from "../../generated/prisma/client";

class User {
    prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async getAll(): Promise<UserType[]> {
        return await this.prisma.user.findMany();
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
}

export default new User(prisma);
