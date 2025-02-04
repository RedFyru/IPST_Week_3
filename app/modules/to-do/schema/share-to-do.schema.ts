import { z } from "zod";
import { idParamSchema } from "./req-params-id.schema";

export const shareToDoSchema = {
    params: idParamSchema,
    body: z.object({
        userId: z.string().uuid(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().max(1000).optional()
    })
};

export type ShareToDoSchema = z.infer<typeof shareToDoSchema.body>;
