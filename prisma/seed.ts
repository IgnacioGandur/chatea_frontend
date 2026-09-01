import type {
    Conversation,
    Participant,
    Prisma,
    User,
} from "~/../generated/prisma/client";
import prisma from "~/db/prisma";
import bcrypt from "bcryptjs";
import { rollupVersion } from "vite";

const password = await bcrypt.hash("bla", 10);

function createPpf(firstName: string, lastName?: string): string {
    return `https://ui-avatars.com/api/?background=random&name=${firstName}+${lastName}`;
}

async function createUsersData(amount: number) {
    const usersData = Array.from({ length: amount }).map(
        (_, i): Prisma.UserCreateInput => {
            const firstName = "User";
            const lastName = `${i}`;
            const username = `User.${i}`;
            const ppf = createPpf("j", `${i}`);

            return {
                firstName,
                lastName,
                username,
                password,
                profilePictureUrl: ppf,
            };
        },
    );

    return await prisma.user.createManyAndReturn({
        data: [
            {
                firstName: "Ignacio",
                lastName: "Gandur",
                username: "ignacio",
                profilePictureUrl: createPpf("j", "g"),
                password,
            },
            {
                firstName: "John",
                lastName: "Doe",
                username: "john",
                profilePictureUrl: createPpf("j", "d"),
                password,
            },
            {
                firstName: "Jane",
                lastName: "Doe",
                username: "jane",
                profilePictureUrl: createPpf("j", "d"),
                password,
            },
            {
                firstName: "Jill",
                lastName: "Doe",
                username: "jill",
                profilePictureUrl: createPpf("j", "d"),
                password,
            },
        ],
    });
}

async function main() {
    // Clean the database before seeding...
    console.log("Cleaning database before seeding...");
    await prisma.user.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.participant.deleteMany();
    console.log("Database cleaned! Ready for seeding.");

    console.log("Seeding users...");
    await createUsersData(50);
    console.log("Users seeded!");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error("Seed error: ", e);
        await prisma.$disconnect();
        process.exit(1);
    })
    .finally(() => console.log("Database seeded!"));
