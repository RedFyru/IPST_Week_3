import type { FastifySchema } from "fastify";
import { z } from "zod";

const schema = z.object({
    title: z.string().max(127),
    description: z.string().max(1000).optional(),
    notifyAt: z.string().datetime().optional(),
    isCompleted: z.boolean().default(false)
});

export type CreateToDoSchema = z.infer<typeof schema>;
export const createToDoFSchema: FastifySchema = { body: schema };
