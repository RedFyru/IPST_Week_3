import { z } from "zod";

const querySchema = z.object({
    search: z.coerce.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(10).optional(),
    offset: z.coerce.number().min(0).default(0).optional(),
    sortBy: z.enum(["title", "createdAt", "notifyAt"]).default("createdAt").optional(),
    sortOrder: z.enum(["asc", "desc"]).default("asc").optional(),
    isCompleted: z.coerce.string().optional()
});

export type QueryToDoSchema = z.infer<typeof querySchema>;

export const queryToDoSchema = { querystring: querySchema };
