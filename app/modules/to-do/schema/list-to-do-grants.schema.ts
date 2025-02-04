import { z } from "zod";
import { idParamSchema } from "./req-params-id.schema";

export const listToDoGrantsSchema = {
    params: idParamSchema
};

export type ListToDoGrantsSchema = z.infer<typeof listToDoGrantsSchema.params>;
