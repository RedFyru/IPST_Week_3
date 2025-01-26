import type { FastifyReply, FastifyRequest } from "fastify";
import { sqlCon } from "../../common/config/kysely-config";
import { HttpStatusCode } from "../../common/enum/http-status-code";
import * as objectivesRepository from "./repository.to-do";
import type { CreateToDoSchema } from "./schema/create-to-do.schema";
import { QueryToDoSchema } from "./schema/query-to-do.schema";
import type { UpdateToDoSchema } from "./schema/update-to-do.schema";

export async function createToDo(req: FastifyRequest<{ Body: CreateToDoSchema }>, rep: FastifyReply) {
    try {
        const { title, description, notifyAt, isCompleted } = req.body;
        const newTask = {
            title,
            description: description || null,
            notifyAt: notifyAt ? new Date(notifyAt) : null,
            isCompleted: isCompleted ?? false,
            creatorId: req.user.id
        };
        const insertedTask = await objectivesRepository.insertObjective(sqlCon, newTask);
        return rep.code(HttpStatusCode.CREATED).send(insertedTask);
    } catch (error) {
        console.error(error);
        return rep.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send({ error: "Failed to create task" });
    }
}

export async function updateToDo(req: FastifyRequest<{ Body: UpdateToDoSchema; Params: { id: string } }>, rep: FastifyReply) {
    const { id } = req.params;
    const { title, description, notifyAt, isCompleted } = req.body;

    try {
        const existingTask = await objectivesRepository.getToDoById(sqlCon, id);
        if (!existingTask) {
            return rep.code(HttpStatusCode.NOT_FOUND).send({ error: "Task not found" });
        }

        const taskToUpdate = await objectivesRepository.updateObjective(sqlCon, id, {
            title,
            description,
            notifyAt: notifyAt ? new Date(notifyAt) : undefined,
            isCompleted
        });

        return rep.code(HttpStatusCode.OK).send(taskToUpdate);
    } catch (error) {
        console.error(error);
        return rep.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send({ error: "Failed to update task" });
    }
}

export async function getToDos(req: FastifyRequest<{ Querystring: QueryToDoSchema }>, rep: FastifyReply) {
    try {
        const { search, limit = 10, offset = 0, sortBy = "createdAt", sortOrder = "asc", isCompleted } = req.query;
        const tasks = await objectivesRepository.getToDos(sqlCon, {
            search,
            limit,
            offset,
            sortBy,
            sortOrder,
            isCompleted
        });
        return rep.code(HttpStatusCode.OK).send(tasks);
    } catch (error) {
        console.error(error);
        return rep.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send({ error: "Failed to fetch tasks" });
    }
}

export async function getToDoById(req: FastifyRequest<{ Params: { id: string } }>, rep: FastifyReply) {
    try {
        const { id } = req.params;
        const task = await objectivesRepository.getToDoById(sqlCon, id);

        if (!task) {
            return rep.code(HttpStatusCode.NOT_FOUND).send({ error: "Task not found" });
        }

        return rep.code(HttpStatusCode.OK).send(task);
    } catch (error) {
        console.error(error);
        return rep.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send({ error: "Failed to fetch task" });
    }
}
