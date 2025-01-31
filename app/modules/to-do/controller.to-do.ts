import type { FastifyReply, FastifyRequest } from "fastify";
import { sqlCon } from "../../common/config/kysely-config";
import { HttpStatusCode } from "../../common/enum/http-status-code";
import { sendEmailNotification } from "../../common/utils/mailer";
import * as objectivesRepository from "./repository.to-do";
import type { CreateToDoSchema } from "./schema/create-to-do.schema";
import { QueryToDoSchema } from "./schema/query-to-do.schema";
import type { ReqParamsIdSchema } from "./schema/req-params-id.schema";
import type { UpdateToDoSchema } from "./schema/update-to-do.schema";

export async function createToDo(req: FastifyRequest<{ Body: CreateToDoSchema }>, rep: FastifyReply) {
    try {
        const { title, description, notifyAt, isCompleted } = req.body;
        const newTask = {
            title,
            description: description || null,
            notifyAt,
            isCompleted: isCompleted ?? false,
            creatorId: req.user.id!
        };
        const insertedTask = await objectivesRepository.insertObjective(sqlCon, newTask);
        return rep.code(HttpStatusCode.CREATED).send(insertedTask);
    } catch (error) {
        throw error;
    }
}

export async function updateToDo(req: FastifyRequest<{ Body: UpdateToDoSchema; Params: ReqParamsIdSchema }>, rep: FastifyReply) {
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
            notifyAt,
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
        const { search, limit, offset, sortBy = "createdAt", sortOrder = "asc", isCompleted } = req.query;
        const tasks = await objectivesRepository.getToDos(sqlCon, {
            search,
            limit: Number(limit),
            offset: Number(offset),
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
        const userId = req.user?.id;

        if (!userId) {
            return rep.code(HttpStatusCode.UNAUTHORIZED).send({ error: "User not authenticated" });
        }
        const task = await objectivesRepository.getToDoById(sqlCon, id);

        if (!task) {
            return rep.code(HttpStatusCode.NOT_FOUND).send({ error: "Task not found" });
        }
        if (task.creatorId === userId) {
            return rep.code(HttpStatusCode.OK).send(task);
        }
        const hasAccess = await objectivesRepository.checkUserAccess(sqlCon, id, userId);
        if (!hasAccess) {
            return rep.code(HttpStatusCode.FORBIDDEN).send({ error: "You do not have access to this task" });
        }

        return rep.code(HttpStatusCode.OK).send(task);
    } catch (error) {
        console.error(error);
        return rep.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send({ error: "Failed to fetch task" });
    }
}

export async function deleteToDo(req: FastifyRequest<{ Params: { id: string } }>, rep: FastifyReply) {
    const { id } = req.params;

    try {
        await objectivesRepository.deleteObjective(sqlCon, id);
        return rep.code(HttpStatusCode.NO_CONTENT).send();
    } catch (error) {
        console.error(error);
        return rep.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send({ error: "Failed to delete task" });
    }
}

export async function shareToDo(req: FastifyRequest<{ Params: { id: string }; Body: { userId: string } }>, rep: FastifyReply) {
    const { id } = req.params;
    const { userId } = req.body;

    try {
        const existingTask = await objectivesRepository.getToDoById(sqlCon, id);
        if (!existingTask) {
            return rep.code(HttpStatusCode.NOT_FOUND).send({ error: "Task not found" });
        }
        if (existingTask.creatorId !== req.user.id) {
            return rep.code(HttpStatusCode.FORBIDDEN).send({ error: "You do not have permission to share this task" });
        }
        const existingAccess = await objectivesRepository.checkUserAccess(sqlCon, id, userId);

        if (existingAccess) {
            return rep.code(HttpStatusCode.OK).send({
                id: existingAccess.id,
                userId: existingAccess.userId,
                objectiveId: existingAccess.objectiveId
            });
        }
        const access = await objectivesRepository.grantAccess(sqlCon, id, userId);
        const user = await sqlCon.selectFrom("users").select(["email"]).where("id", "=", userId).executeTakeFirst();

        if (user && user.email) {
            const subject = "You have been granted access to a task";
            const text = `You have been granted access to the task: ${existingTask.title}.`;
            await sendEmailNotification(user.email, subject, text);
        }
        return rep.code(HttpStatusCode.OK).send({
            id: access.id,
            userId: access.userId,
            objectiveId: access.objectiveId
        });
    } catch (error) {
        console.error("Error in shareToDo:", error);
        return rep.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send({ error: "Failed to grant access" });
    }
}

export async function revokeToDoAccess(req: FastifyRequest<{ Params: { id: string }; Body: { userId: string } }>, rep: FastifyReply) {
    const { id } = req.params;
    const { userId } = req.body;

    try {
        const existingTask = await objectivesRepository.getToDoById(sqlCon, id);
        if (!existingTask) {
            return rep.code(HttpStatusCode.NOT_FOUND).send({ error: "Task not found" });
        }

        if (existingTask.creatorId !== req.user.id) {
            return rep.code(HttpStatusCode.FORBIDDEN).send({ error: "You do not have permission to revoke access" });
        }
        await objectivesRepository.revokeAccess(sqlCon, id, userId);

        return rep.code(HttpStatusCode.NO_CONTENT).send();
    } catch (error) {
        console.error(error);
        return rep.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send({ error: "Failed to revoke access" });
    }
}

export async function listToDoGrants(req: FastifyRequest<{ Params: { id: string } }>, rep: FastifyReply) {
    const { id } = req.params;

    try {
        const existingTask = await objectivesRepository.getToDoById(sqlCon, id);
        if (!existingTask) {
            return rep.code(HttpStatusCode.NOT_FOUND).send({ error: "Task not found" });
        }
        if (existingTask.creatorId !== req.user.id) {
            return rep.code(HttpStatusCode.FORBIDDEN).send({ error: "You do not have permission to view grants" });
        }
        const grants = await objectivesRepository.listGrants(sqlCon, id);

        return rep.code(HttpStatusCode.OK).send(grants);
    } catch (error) {
        console.error(error);
        return rep.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send({ error: "Failed to fetch grants" });
    }
}
