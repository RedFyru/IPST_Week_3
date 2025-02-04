import type { FastifyReply, FastifyRequest } from "fastify";
import { sqlCon } from "../../common/config/kysely-config";
import { HttpStatusCode } from "../../common/enum/http-status-code";
import { sendEmailNotification } from "../../common/utils/mailer";
import * as objectivesRepository from "./repository.to-do";
import type { CreateToDoSchema } from "./schema/create-to-do.schema";
import type { GetToDoByIdSchema } from "./schema/get-to-do-by-id.schema";
import type { ListToDoGrantsSchema } from "./schema/list-to-do-grants.schema";
import { QueryToDoSchema } from "./schema/query-to-do.schema";
import type { ReqParamsIdSchema } from "./schema/req-params-id.schema";
import type { RevokeToDoAccessSchema } from "./schema/revoke-to-do-access.schema";
import type { ShareToDoSchema } from "./schema/share-to-do.schema";
import type { UpdateToDoSchema } from "./schema/update-to-do.schema";

export async function createToDo(req: FastifyRequest<{ Body: CreateToDoSchema }>, rep: FastifyReply) {
    const newTask = { ...req.body, creatorId: req.user.id! };
    const insertedTask = await objectivesRepository.insertObjective(sqlCon, newTask);
    return rep.code(HttpStatusCode.CREATED).send(insertedTask);
}

export async function updateToDo(req: FastifyRequest<{ Body: UpdateToDoSchema; Params: ReqParamsIdSchema }>, rep: FastifyReply) {
    const { id } = req.params;
    const taskToUpdate = await objectivesRepository.updateObjective(sqlCon, id, req.body);
    return rep.code(HttpStatusCode.OK).send(taskToUpdate);
}

export async function getToDos(req: FastifyRequest<{ Querystring: QueryToDoSchema }>, rep: FastifyReply) {
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
}

export async function getToDoById(req: FastifyRequest<{ Params: GetToDoByIdSchema }>, rep: FastifyReply) {
    const { id } = req.params;
    const userId = req.user.id;

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
}

export async function deleteToDo(req: FastifyRequest<{ Params: GetToDoByIdSchema }>, rep: FastifyReply) {
    const { id } = req.params;
    await objectivesRepository.deleteObjective(sqlCon, id);
    return rep.code(HttpStatusCode.NO_CONTENT).send();
}

export async function shareToDo(req: FastifyRequest<{ Params: GetToDoByIdSchema; Body: ShareToDoSchema }>, rep: FastifyReply) {
    const { id } = req.params;
    const { userId } = req.body;

    const existingAccess = await objectivesRepository.checkUserAccessAndReturn(sqlCon, id, userId);
    if (existingAccess) {
        return rep.code(HttpStatusCode.OK).send(existingAccess);
    }

    const access = await objectivesRepository.grantAccess(sqlCon, id, userId);
    const user = await sqlCon.selectFrom("users").select(["email"]).where("id", "=", userId).executeTakeFirst();
    const task = await sqlCon.selectFrom("objectives").select(["title"]).where("id", "=", id).executeTakeFirst(); // Получаем название задачи из базы данных

    if (user && user.email && task && task.title) {
        const subject = "You have been granted access to a task";
        const text = `You have been granted access to the task: ${task.title}.`;
        await sendEmailNotification(user.email, subject, text);
    }

    return rep.code(HttpStatusCode.OK).send({ id: access.id, userId: access.userId, objectiveId: access.objectiveId });
}

export async function revokeToDoAccess(req: FastifyRequest<{ Params: GetToDoByIdSchema; Body: RevokeToDoAccessSchema }>, rep: FastifyReply) {
    const { id } = req.params;
    const { userId } = req.body;

    const existingTask = await objectivesRepository.getToDoById(sqlCon, id);
    if (!existingTask) {
        return rep.code(HttpStatusCode.NOT_FOUND).send({ error: "Task not found" });
    }

    if (existingTask.creatorId !== req.user.id) {
        return rep.code(HttpStatusCode.FORBIDDEN).send({ error: "You do not have permission to revoke access" });
    }

    await objectivesRepository.revokeAccess(sqlCon, id, userId);
    return rep.code(HttpStatusCode.NO_CONTENT).send();
}

export async function listToDoGrants(req: FastifyRequest<{ Params: ListToDoGrantsSchema }>, rep: FastifyReply) {
    const { id } = req.params;

    const existingTask = await objectivesRepository.getToDoById(sqlCon, id);
    if (!existingTask) {
        return rep.code(HttpStatusCode.NOT_FOUND).send({ error: "Task not found" });
    }
    if (existingTask.creatorId !== req.user.id) {
        return rep.code(HttpStatusCode.FORBIDDEN).send({ error: "You do not have permission to view grants" });
    }

    const grants = await objectivesRepository.listGrants(sqlCon, id);
    return rep.code(HttpStatusCode.OK).send(grants);
}
