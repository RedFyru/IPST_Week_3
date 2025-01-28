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
