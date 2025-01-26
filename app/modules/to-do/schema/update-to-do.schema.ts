import type { FastifySchema } from "fastify";
import { z } from "zod";

const schema = z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
    notifyAt: z.string().datetime().optional(),
    isCompleted: z.boolean().optional()
});

export type UpdateToDoSchema = z.infer<typeof schema>;

export const updateToDoFSchema: FastifySchema = { body: schema };
