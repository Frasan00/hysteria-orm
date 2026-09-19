/**
 * On SQLite, `t.increment("id")` already renders
 * `integer primary key autoincrement` inline in the column definition. Calling
 * `.primaryKey()` on top of that used to also emit a table-level
 * `constraint "pk_<table>_<col>" primary key`, and SQLite rejects the CREATE with
 * `table "x" has more than one primary key`.
 *
 * The constraint builder now skips the table-level constraint when the column
 * already carries the primary key inline.
 */

import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";

// The double-primary-key bug is SQLite-specific (its column interpreter inlines
// `primary key autoincrement`), so this suite only runs there. Other dialects
// accept a table-level primary key alongside the column definition.
const isSqlite = env.DB_TYPE === "sqlite";
const itIfSqlite = isSqlite ? test : test.skip;

let sql: SqlDataSource;

beforeAll(async () => {
  sql = new SqlDataSource();
  await sql.connect();
});

afterAll(async () => {
  await sql.disconnect();
});

describe(`[${env.DB_TYPE}] sqlite increment primary key`, () => {
  itIfSqlite(
    "increment() + primaryKey() creates exactly one primary key",
    async () => {
      await sql.schema().dropTableIfExists("pk_probe");
      await sql.schema().createTable("pk_probe", (table) => {
        table.increment("id").primaryKey();
        table.varchar("name", 40);
      });

      // The insert proves the table exists with a working auto-increment key.
      await sql.rawQuery("insert into pk_probe (name) values ('a')");
      const listed = await sql.getColumnListing("pk_probe");
      expect(listed).toContain("id");
    },
  );

  itIfSqlite("an explicit AUTOINCREMENT key still generates ids", async () => {
    await sql.schema().dropTableIfExists("pk_probe");
    await sql.schema().createTable("pk_probe", (table) => {
      table.increment("id").primaryKey();
      table.varchar("name", 40);
    });

    await sql.rawQuery("insert into pk_probe (name) values ('a')");
    await sql.rawQuery("insert into pk_probe (name) values ('b')");
    const after = await sql.getColumnListing("pk_probe");

    // Two rows inserted without ids: the key generated both.
    const generated = await sql.from("pk_probe").getCount();
    expect(generated).toBe(2);
    expect(after.length).toBeGreaterThan(0);
  });
});
