import { z } from "zod";
import { idParamSchema } from "./req-params-id.schema";

export const getToDoByIdSchema = {
    params: idParamSchema
};

export type GetToDoByIdSchema = z.infer<typeof getToDoByIdSchema.params>;
