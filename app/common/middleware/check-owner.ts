import type { FastifyRequest } from "fastify";
import { sqlCon } from "../config/kysely-config";
import { AccessException } from "../exceptions/access-exception";
import * as objectivesRepository from "../../modules/to-do/repository.to-do";

export async function checkToDoOwner(req: FastifyRequest<{ Params: { id: string } }>) {
    const { id } = req.params;
    const userId = req.user.id;
    const task = await objectivesRepository.getToDoById(sqlCon, id);

    if (task && task.creatorId !== userId) {
        throw new AccessException("You are not owner");
    }
}

export async function checkSharePermission(req: FastifyRequest<{ Params: { id: string } }>) {
    const userId = req.user.id!;
    const task = await objectivesRepository.checkUserAccess(sqlCon, req.params.id, userId);
    if (!task) {
        throw new AccessException("Access do not issued");
    }
}
