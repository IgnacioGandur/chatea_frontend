import "dotenv/config";
import { faker } from "@faker-js/faker";
import { PrismaClient } from "~/../generated/prisma/client";

const prisma = new PrismaClient();

export async function seedGroups(groupsAmount: number) {
    const users = await prisma.user.findMany({
        select: {
            id: true,
        },
    });

    if (users.length < 2) {
        throw new Error("Create at least 2 users first.");
    }

    for (let i = 0; i < groupsAmount; i++) {
        const owner = faker.helpers.arrayElement(users);

        const others = faker.helpers.arrayElements(
            users.filter((u) => u.id !== owner.id),
            { min: 0, max: Math.min(15, users.length - 1) },
        );

        await prisma.conversation.create({
            data: {
                isGroup: true,
                title: faker.lorem.words({ min: 2, max: 5 }),
                description: faker.lorem.sentence(),
                profilePicture: `https://picsum.photos/seed/group-${Date.now()}-${i}/200`,
                ownerId: owner.id,
                participants: {
                    create: [
                        {
                            userId: owner.id,
                            role: "OWNER",
                        },
                        ...others.map((u) => ({
                            userId: u.id,
                            role: "USER" as const,
                        })),
                    ],
                },
            },
        });
    }

    console.log(`Create ${groupsAmount} groups.`);
}

seedGroups(Number(process.argv[2]) ?? 50)
    .catch(console.error)
    .finally(() => prisma.$disconnect());
