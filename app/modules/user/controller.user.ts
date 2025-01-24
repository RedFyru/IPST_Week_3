import bcrypt from "bcrypt";
import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import type { IHandlingResponseError } from "../../common/config/http-response.ts";
import { sqlCon } from "../../common/config/kysely-config";
import { HandlingErrorType } from "../../common/enum/error-types";
import { HttpStatusCode } from "../../common/enum/http-status-code";
import * as userRepository from "./repository.user";
import type { loginSchema } from "./schemas/login.schema.ts";
import type { signUpSchema } from "./schemas/sign-up.schema.ts";

const generateJwt = (id: string, email: string) => {
    return jwt.sign({ id, email }, process.env.JWT_SECRET!, { expiresIn: "7d" });
};

export async function create(req: FastifyRequest<{ Body: signUpSchema }>, rep: FastifyReply) {
    const emailExists = await userRepository.getByEmail(sqlCon, req.body.email);
    if (emailExists) {
        const info: IHandlingResponseError = { type: HandlingErrorType.Unique, property: "email" };
        return rep.code(HttpStatusCode.CONFLICT).send(info);
    }
    const hashPassword = await bcrypt.hash(req.body.password, 5);

    const user = {
        name: req.body.name,
        email: req.body.email,
        password: hashPassword
    };

    const insertedUser = await userRepository.insert(sqlCon, user);
    const token = generateJwt(insertedUser.id, insertedUser.email);

    const data = {
        id: insertedUser.id,
        accessToken: token
    };
    return rep.code(HttpStatusCode.OK).send(data);
}

export async function login(req: FastifyRequest<{ Body: loginSchema }>, rep: FastifyReply) {
    const user = await userRepository.getByEmail(sqlCon, req.body.email);
    if (!user) {
        const info: IHandlingResponseError = { type: HandlingErrorType.Found, property: "email" };
        return rep.code(HttpStatusCode.NOT_FOUND).send(info);
    }
    if (user.password === null) {
        const info: IHandlingResponseError = { type: HandlingErrorType.Empty, property: "password" };
        return rep.code(HttpStatusCode.NOT_ACCEPTABLE).send(info);
    }
    const isPasswordValid = await bcrypt.compare(req.body.password, user.password!);
    if (!isPasswordValid) {
        const info: IHandlingResponseError = { type: HandlingErrorType.Match, property: "password" };
        return rep.code(HttpStatusCode.UNAUTHORIZED).send(info);
    }
    const token = generateJwt(user.id, user.email);

    const data = {
        id: user.id,
        accessToken: token
    };

    return rep.code(HttpStatusCode.OK).send(data);
}

export async function me(req: FastifyRequest, rep: FastifyReply) {
    const user = await userRepository.getById(sqlCon, req.user.id!);

    return rep.code(HttpStatusCode.OK).send(user);
}
