import { ToDoTask } from "../modules/to-do/types";

declare module "fastify" {
    interface FastifyRequest {
        task?: ToDoTask;
    }
}
