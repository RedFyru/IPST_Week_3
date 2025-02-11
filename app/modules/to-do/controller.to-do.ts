import type { FastifyReply, FastifyRequest } from "fastify";
import { sqlCon } from "../../common/config/kysely-config";
import { sendEmailNotification } from "../../common/config/mailer-config";
import { HttpStatusCode } from "../../common/enum/http-status-code";
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
    const insertedTask = await objectivesRepository.insertObjective(sqlCon, { ...req.body, creatorId: req.user.id! });
    return rep.code(HttpStatusCode.CREATED).send(insertedTask);
}

export async function updateToDo(req: FastifyRequest<{ Body: UpdateToDoSchema; Params: ReqParamsIdSchema }>, rep: FastifyReply) {
    const { id } = req.params;
    const taskToUpdate = await objectivesRepository.updateObjective(sqlCon, id, req.body);
    return rep.code(HttpStatusCode.OK).send(taskToUpdate);
}

export async function getToDos(req: FastifyRequest<{ Querystring: QueryToDoSchema }>, rep: FastifyReply) {
    const tasks = await objectivesRepository.getToDos(sqlCon, req.query);
    return rep.code(HttpStatusCode.OK).send(tasks);
}

export async function getToDoById(req: FastifyRequest<{ Params: GetToDoByIdSchema }>, rep: FastifyReply) {
    const { id } = req.params;

    const task = await objectivesRepository.getToDoById(sqlCon, id);
    if (!task) {
        return rep.code(HttpStatusCode.NOT_FOUND).send({ error: "Task not found" });
    }
    return rep.code(HttpStatusCode.OK).send(task);
}

export async function deleteToDo(req: FastifyRequest<{ Params: GetToDoByIdSchema }>, rep: FastifyReply) {
    const { id } = req.params;
    await objectivesRepository.deleteObjective(sqlCon, id);
    return rep.code(HttpStatusCode.NO_CONTENT).send("Task deleted");
}

export async function shareToDo(req: FastifyRequest<{ Params: GetToDoByIdSchema; Body: ShareToDoSchema }>, rep: FastifyReply) {
    const { id } = req.params;
    const { userId } = req.body;

    const existingAccess = await objectivesRepository.checkUserAccess(sqlCon, id, userId);
    if (existingAccess) {
        return rep.code(HttpStatusCode.OK).send(existingAccess);
    }

    await objectivesRepository.grantAccess(sqlCon, { objectiveId: id, userId: userId });
    const user = await objectivesRepository.getUserById(sqlCon, userId);
    const task = await objectivesRepository.getObjectiveTitleById(sqlCon, id);

    if (user && user.email && task && task.title) {
        const subject = "You have been granted access to a task";
        const text = `You have been granted access to the task: ${task.title}.`;
        await sendEmailNotification(user.email, subject, text);
    }

    return rep.code(HttpStatusCode.OK).send("Access granted");
}

export async function revokeToDoAccess(req: FastifyRequest<{ Params: GetToDoByIdSchema; Body: RevokeToDoAccessSchema }>, rep: FastifyReply) {
    const { id } = req.params;
    const { userId } = req.body;

    const existingTask = await objectivesRepository.getToDoById(sqlCon, id);
    if (!existingTask) {
        return rep.code(HttpStatusCode.NOT_FOUND).send({ error: "Task not found" });
    }
    await objectivesRepository.revokeAccess(sqlCon, id, userId);
    return rep.code(HttpStatusCode.NO_CONTENT).send("Access revoked");
}

export async function listToDoGrants(req: FastifyRequest<{ Params: ListToDoGrantsSchema }>, rep: FastifyReply) {
    const { id } = req.params;

    const existingTask = await objectivesRepository.getToDoById(sqlCon, id);
    if (!existingTask) {
        return rep.code(HttpStatusCode.NOT_FOUND).send({ error: "Task not found" });
    }
    const grants = await objectivesRepository.listGrants(sqlCon, id);
    return rep.code(HttpStatusCode.OK).send(grants);
}
