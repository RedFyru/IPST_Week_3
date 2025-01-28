import type { FastifyInstance } from "fastify";
import * as toDoController from "./controller.to-do";
import { getToDoById } from "./controller.to-do";
import { createToDoFSchema } from "./schema/create-to-do.schema";
import { queryToDoSchema } from "./schema/query-to-do.schema";
import { updateToDoFSchema } from "./schema/update-to-do.schema";

export const todoRouter = async (app: FastifyInstance) => {
    app.post("/", { schema: createToDoFSchema }, toDoController.createToDo);
    app.patch("/:id", { schema: updateToDoFSchema }, toDoController.updateToDo);
    app.get("/", { schema: queryToDoSchema }, toDoController.getToDos);
    app.get("/:id", {}, getToDoById);
};
