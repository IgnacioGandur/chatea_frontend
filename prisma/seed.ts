import prisma from "~/db/prisma";
import bcrypt from "bcryptjs";

const password = await bcrypt.hash("bla", 10);
const ppfBase = "https://ui-avatars.com/api/?background=random&name=";

async function main() {
    // Users
    const johnDoe = await prisma.user.create({
        data: {
            username: "john",
            firstName: "John",
            lastName: "Doe",
            password,
            profilePictureUrl: `${ppfBase}john+doe`,
        },
    });

    const janeDoe = await prisma.user.create({
        data: {
            username: "jane",
            firstName: "Jane",
            lastName: "Doe",
            password,
            profilePictureUrl: `${ppfBase}jane+doe`,
        },
    });

    const jillDoe = await prisma.user.create({
        data: {
            username: "jill",
            firstName: "Jill",
            lastName: "Doe",
            password,
            profilePictureUrl: `${ppfBase}jill+doe`,
        },
    });

    const ignacio = await prisma.user.create({
        data: {
            username: "ignacio",
            firstName: "Ignacio",
            lastName: "Doe",
            password,
            profilePictureUrl: `${ppfBase}ignacio+doe`,
        },
    });

    // Conversations
    const conversation1 = await prisma.conversation.create({
        data: {
            isGroup: false,
            ownerId: johnDoe.id,
            messages: {
                createMany: {
                    data: [
                        {
                            content: "Hello from John Doe to Jane Doe!",
                            senderId: johnDoe.id,
                        },
                        {
                            content: "Hello from Jane Doe to John Doe!",
                            senderId: janeDoe.id,
                        },
                    ],
                },
            },
            participants: {
                createMany: {
                    data: [
                        {
                            userId: johnDoe.id,
                            joinedAt: new Date(),
                        },
                        {
                            userId: janeDoe.id,
                            joinedAt: new Date(),
                        },
                    ],
                },
            },
        },
    });

    const conversation2 = await prisma.conversation.create({
        data: {
            isGroup: false,
            ownerId: jillDoe.id,
            messages: {
                createMany: {
                    data: [
                        {
                            content: "Hello from Ignacio Gandur to Jane Doe!",
                            senderId: ignacio.id,
                        },
                        {
                            content: "Hello from Jill Doe to Ignacio Gandur!",
                            senderId: jillDoe.id,
                        },
                    ],
                },
            },
            participants: {
                createMany: {
                    data: [
                        {
                            userId: jillDoe.id,
                            joinedAt: new Date(),
                        },
                        {
                            userId: ignacio.id,
                            joinedAt: new Date(),
                        },
                    ],
                },
            },
        },
    });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
