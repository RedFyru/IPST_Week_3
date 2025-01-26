import type { FastifyInstance } from "fastify";
import { todoRouter } from "./to-do/router.to-do";
import { userRouter } from "./user/router.user";

interface IProvider {
    instance: (app: FastifyInstance) => Promise<void>;
    prefix: string;
}

export const HttpProvider: IProvider[] = [
    { instance: userRouter, prefix: "user" },
    { instance: todoRouter, prefix: "" }
];
