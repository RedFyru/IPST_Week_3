import { type Insertable, type Kysely, Updateable } from "kysely";
import { DB, Objectives, UserObjectiveShares } from "../../common/types/kysely/db.type";

type InsertableObjectiveRowType = Insertable<Objectives>;

export async function insertObjective(con: Kysely<DB>, entity: InsertableObjectiveRowType) {
    return await con.insertInto("objectives").returningAll().values(entity).executeTakeFirstOrThrow();
}

export async function updateObjective(con: Kysely<DB>, id: string, updates: Updateable<Objectives>) {
    return await con
        .updateTable("objectives")
        .set({
            ...updates,
            updatedAt: new Date()
        })
        .where("id", "=", id)
        .returningAll()
        .executeTakeFirst();
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

export async function grantAccess(con: Kysely<DB>, entity: Insertable<UserObjectiveShares>) {
    return con.insertInto("user-objective-shares").values(entity).executeTakeFirstOrThrow();
}

export async function checkUserAccess(con: Kysely<DB>, objectiveId: string, userId: string) {
    return await con.selectFrom("user-objective-shares").selectAll().where("objectiveId", "=", objectiveId).where("userId", "=", userId).executeTakeFirst();
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

export async function getUserById(con: Kysely<DB>, userId: string) {
    return await con.selectFrom("users").select(["email"]).where("id", "=", userId).executeTakeFirst();
}

export async function getObjectiveTitleById(con: Kysely<DB>, objectiveId: string) {
    return await con.selectFrom("objectives").select(["title"]).where("id", "=", objectiveId).executeTakeFirst();
}
