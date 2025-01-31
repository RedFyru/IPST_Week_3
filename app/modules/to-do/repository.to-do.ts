import { type Insertable, type Kysely, Updateable } from "kysely";
import { DB, Objectives } from "../../common/types/kysely/db.type";

type InsertableObjectiveRowType = Insertable<Objectives>;

export async function insertObjective(con: Kysely<DB>, entity: InsertableObjectiveRowType) {
    return await con.insertInto("objectives").returningAll().values(entity).executeTakeFirstOrThrow();
}

export async function updateObjective(con: Kysely<DB>, id: string, updates: Updateable<Objectives>) {
    const result = await con
        .updateTable("objectives")
        .set({
            ...updates,
            updatedAt: new Date()
        })
        .where("id", "=", id)
        .returningAll()
        .executeTakeFirst();

    return result;
}

interface GetToDosOptions {
    search?: string;
    limit: number;
    offset: number;
    sortBy: "title" | "createdAt" | "notifyAt";
    sortOrder: "asc" | "desc";
    isCompleted?: boolean;
}

export async function getToDos(con: Kysely<DB>, options: GetToDosOptions) {
    let query = con.selectFrom("objectives").selectAll();
    if (options.search) {
        query = query.where("title", "ilike", `%${options.search}%`);
    }

    if (options.isCompleted !== undefined) {
        query = query.where("isCompleted", "=", options.isCompleted);
    }
    query = query.orderBy(options.sortBy, options.sortOrder);
    query = query.limit(options.limit).offset(options.offset);

    return await query.execute();
}

export async function getToDoById(con: Kysely<DB>, id: string) {
    return await con.selectFrom("objectives").selectAll().where("id", "=", id).executeTakeFirst();
}

export async function deleteObjective(con: Kysely<DB>, id: string) {
    return con.deleteFrom("objectives").where("id", "=", id).execute();
}

export async function grantAccess(con: Kysely<DB>, objectiveId: string, userId: string) {
    const existingAccess = await con.selectFrom("user-objective-shares").selectAll().where("objectiveId", "=", objectiveId).where("userId", "=", userId).executeTakeFirst();
    if (existingAccess) {
        return {
            id: existingAccess.id.toString(),
            userId: existingAccess.userId.toString(),
            objectiveId: existingAccess.objectiveId.toString()
        };
    }
    const newAccess: Insertable<DB["user-objective-shares"]> = {
        id: crypto.randomUUID(),
        objectiveId,
        userId
    };
    await con.insertInto("user-objective-shares").values(newAccess).executeTakeFirstOrThrow();
    return {
        id: newAccess.id?.toString() || "",
        userId: newAccess.userId.toString(),
        objectiveId: newAccess.objectiveId.toString()
    };
}

export async function checkUserAccess(con: Kysely<DB>, objectiveId: string, userId: string) {
    const access = await con.selectFrom("user-objective-shares").selectAll().where("objectiveId", "=", objectiveId).where("userId", "=", userId).executeTakeFirst();
    return access;
}

export async function revokeAccess(con: Kysely<DB>, objectiveId: string, userId: string) {
    return con.deleteFrom("user-objective-shares").where("objectiveId", "=", objectiveId).where("userId", "=", userId).execute();
}

export async function listGrants(con: Kysely<DB>, objectiveId: string) {
    return con
        .selectFrom("user-objective-shares")
        .innerJoin("users", "users.id", "user-objective-shares.userId")
        .select(["users.id", "users.email", "users.name"])
        .where("user-objective-shares.objectiveId", "=", objectiveId)
        .execute();
}
