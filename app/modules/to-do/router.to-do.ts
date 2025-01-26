import type { FastifyInstance } from "fastify";
import * as toDoController from "./controller.to-do";
import { getToDoById } from "./controller.to-do";
import { createToDoFSchema } from "./schema/create-to-do.schema";
import { queryToDoSchema } from "./schema/query-to-do.schema";
import { updateToDoFSchema } from "./schema/update-to-do.schema";

export const todoRouter = async (app: FastifyInstance) => {
    app.post("/to-do", { schema: createToDoFSchema }, toDoController.createToDo);
    app.patch("/to-do/:id", { schema: updateToDoFSchema }, toDoController.updateToDo);
    app.get("/to-do", { schema: queryToDoSchema }, toDoController.getToDos);
    app.get("/to-do/:id", {}, getToDoById);
};
