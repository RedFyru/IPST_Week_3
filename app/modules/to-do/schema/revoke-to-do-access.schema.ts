import { z } from "zod";
import { idParamSchema } from "./req-params-id.schema";

export const revokeToDoAccessSchema = {
    params: idParamSchema,
    body: z.object({
        userId: z.string().uuid()
    })
};

export type RevokeToDoAccessSchema = z.infer<typeof revokeToDoAccessSchema.body>;
