import { PrismaClient, Prisma } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env["DATABASE_URL"],
});

const prisma = new PrismaClient({ adapter });

const userData: Prisma.UserCreateInput[] = [
    {
        username: "john_doe",
        password: "123",
    },
    {
        username: "jane_doe",
        password: "123",
    },
];

export async function main() {
    for (const u of userData) {
        await prisma.user.create({ data: u });
    }
}

main();
