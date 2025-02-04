import type { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
import { sqlCon } from "../common/config/kysely-config";
import { HttpStatusCode } from "../common/enum/http-status-code";
import * as objectivesRepository from "../modules/to-do/repository.to-do";

export async function checkToDoOwner(req: FastifyRequest<{ Params: { id: string } }>, rep: FastifyReply, done: HookHandlerDoneFunction) {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const task = await objectivesRepository.getToDoById(sqlCon, id);

        if (!task) {
            return rep.code(HttpStatusCode.NOT_FOUND).send({ error: "Task not found" });
        }

        if (task.creatorId !== userId) {
            return rep.code(HttpStatusCode.FORBIDDEN).send({ error: "You do not have permission to perform this action" });
        }

        req.task = task;
        done();
    } catch (error) {
        console.error(error);
        return rep.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send({ error: "Failed to verify task ownership" });
    }
}

export async function checkTaskExists(req: FastifyRequest<{ Params: { id: string } }>, rep: FastifyReply, done: HookHandlerDoneFunction) {
    const { id } = req.params;

    try {
        const task = await objectivesRepository.getToDoById(sqlCon, id);
        if (!task) {
            return rep.code(HttpStatusCode.NOT_FOUND).send({ error: "Task not found" });
        }
        req.task = task;
        done();
    } catch (error) {
        console.error("Error in checkTaskExists:", error);
        return rep.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send({ error: "Failed to check task existence" });
    }
}

export async function checkSharePermission(req: FastifyRequest<{ Params: { id: string } }>, rep: FastifyReply, done: HookHandlerDoneFunction) {
    const userId = req.user.id;
    const task = req.task;

    if (!task) {
        return rep.code(HttpStatusCode.NOT_FOUND).send({ error: "Task not found" });
    }

    if (task.creatorId !== userId) {
        return rep.code(HttpStatusCode.FORBIDDEN).send({ error: "You do not have permission to share this task" });
    }

    done();
}
