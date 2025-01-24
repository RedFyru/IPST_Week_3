import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
    await db.schema
        .createTable("users")
        .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
        .addColumn("name", "varchar(127)")
        .addColumn("email", "varchar(127)", (col) => col.unique().notNull())
        .addColumn("password", "text")
        .execute();
}

export async function down(db: Kysely<any>) {
    await db.schema.dropTable("users").execute();
}
