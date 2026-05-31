import type { Prisma } from "../../generated/prisma/client";
import type { createMessageInclude } from "./message.includes";

export type CreateMessage = Prisma.MessageGetPayload<{
    include: typeof createMessageInclude;
}>;
