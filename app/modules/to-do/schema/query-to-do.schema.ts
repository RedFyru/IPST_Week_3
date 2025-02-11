import { z } from "zod";

const querySchema = z.object({
    search: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(10),
    offset: z.coerce.number().min(0).default(0),
    sortBy: z.enum(["title", "createdAt", "notifyAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
    isCompleted: z
        .enum(["true", "false"])
        .transform((value) => value === "true")
        .optional()
});

export type QueryToDoSchema = z.infer<typeof querySchema>;

export const queryToDoSchema = { querystring: querySchema };
