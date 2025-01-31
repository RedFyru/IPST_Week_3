import type { FastifyInstance } from "fastify";
import { checkToDoOwner } from "../../middleware/check-owner";
import * as toDoController from "./controller.to-do";
import { createToDoFSchema } from "./schema/create-to-do.schema";
import { queryToDoSchema } from "./schema/query-to-do.schema";
import { updateToDoFSchema } from "./schema/update-to-do.schema";

export const todoRouter = async (app: FastifyInstance) => {
    app.post("/", { schema: createToDoFSchema }, toDoController.createToDo);
    app.patch("/:id", { schema: updateToDoFSchema, preHandler: checkToDoOwner }, toDoController.updateToDo);
    app.delete("/:id", { preHandler: checkToDoOwner }, toDoController.deleteToDo);
    app.get("/", { schema: queryToDoSchema }, toDoController.getToDos);
    app.get("/:id", {}, toDoController.getToDoById);
    app.post("/:id/share", { preHandler: checkToDoOwner }, toDoController.shareToDo);
    app.delete("/:id/revoke", { preHandler: checkToDoOwner }, toDoController.revokeToDoAccess);
    app.get("/:id/list-grants", { preHandler: checkToDoOwner }, toDoController.listToDoGrants);
};
