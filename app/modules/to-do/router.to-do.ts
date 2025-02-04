import fastifyAuth from "@fastify/auth";
import type { FastifyInstance } from "fastify";
import { checkSharePermission, checkTaskExists, checkToDoOwner } from "../../middleware/check-owner";
import * as toDoController from "./controller.to-do";
import { createToDoFSchema } from "./schema/create-to-do.schema";
import { getToDoByIdSchema } from "./schema/get-to-do-by-id.schema";
import { listToDoGrantsSchema } from "./schema/list-to-do-grants.schema";
import { queryToDoSchema } from "./schema/query-to-do.schema";
import { revokeToDoAccessSchema } from "./schema/revoke-to-do-access.schema";
import { shareToDoSchema } from "./schema/share-to-do.schema";
import { updateToDoFSchema } from "./schema/update-to-do.schema";

export const todoRouter = async (app: FastifyInstance) => {
    await app.register(fastifyAuth);

    app.post("/", { schema: createToDoFSchema }, toDoController.createToDo);
    app.patch("/:id", { schema: updateToDoFSchema, preHandler: app.auth([checkToDoOwner]) }, toDoController.updateToDo);
    app.delete("/:id", { preHandler: app.auth([checkToDoOwner]) }, toDoController.deleteToDo);
    app.get("/", { schema: queryToDoSchema }, toDoController.getToDos);
    app.get("/:id", { schema: getToDoByIdSchema, preHandler: app.auth([checkTaskExists, checkToDoOwner]) }, toDoController.getToDoById);
    app.post("/:id/share", { schema: shareToDoSchema, preHandler: app.auth([checkTaskExists, checkSharePermission]) }, toDoController.shareToDo);
    app.delete("/:id/revoke", { schema: revokeToDoAccessSchema, preHandler: app.auth([checkToDoOwner]) }, toDoController.revokeToDoAccess);
    app.get("/:id/list-grants", { schema: listToDoGrantsSchema, preHandler: app.auth([checkToDoOwner]) }, toDoController.listToDoGrants);
};
