/**
 * DB-free characterization tests for SQLite in-memory databases, which are
 * private to their connection. A transaction runs on its own connection, so it
 * cannot see the main connection's tables unless the database was opened as a
 * shared-cache memory database. Both halves of that contract are pinned here so
 * a future change to the sqlite adapters fails loudly and has to update the docs.
 */

import { SqlDataSource } from "../../../src/sql/sql_data_source";

const createWidgetTable = async (sql: SqlDataSource) => {
  // The shared-cache case reuses one in-memory database, so start from a clean slate.
  await sql.rawQuery("DROP TABLE IF EXISTS widgets");
  await sql.rawQuery(
    "CREATE TABLE widgets (id integer primary key, name text not null)",
  );
  await sql.rawQuery("INSERT INTO widgets (name) VALUES ('main')");
};

describe("sqlite :memory: and transactions", () => {
  it("a bare :memory: transaction cannot see the main connection's tables", async () => {
    const sql = new SqlDataSource({ type: "sqlite", database: ":memory:" });
    await sql.connect();

    try {
      await createWidgetTable(sql);

      await expect(
        sql.transaction(async (trx) =>
          trx.sql.rawQuery("SELECT * FROM widgets"),
        ),
      ).rejects.toThrow(/no such table/i);
    } finally {
      await sql.disconnect();
    }
  });

  it("a shared-cache memory database lets the transaction see them", async () => {
    const sql = new SqlDataSource({
      type: "sqlite",
      database: "file::memory:?cache=shared",
    });
    await sql.connect();

    try {
      await createWidgetTable(sql);

      const rows = (await sql.transaction(async (trx) =>
        trx.sql.rawQuery("SELECT name FROM widgets"),
      )) as { name: string }[];

      expect(rows.map((row) => row.name)).toEqual(["main"]);
    } finally {
      await sql.disconnect();
    }
  });
});
