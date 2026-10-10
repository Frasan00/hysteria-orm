/**
 * DB-free: a file-backed sqlite database in a temp directory, so this needs no
 * server. The point is that a lazy data source has to connect when a stream is the
 * first operation, not only when a query is.
 */

import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { SqlDataSource } from "../../../src/sql/sql_data_source";

const DB_PATH = path.resolve(tmpdir(), `hysteria-lazy-stream-${Date.now()}.db`);

describe("SqlDataSource lazyLoad streaming", () => {
  beforeAll(async () => {
    const setup = new SqlDataSource({
      type: "sqlite",
      database: DB_PATH,
      logs: false,
    });

    await setup.connect();
    await setup.rawQuery(
      "CREATE TABLE widgets (id integer primary key, name text not null)",
    );
    await setup.rawQuery("INSERT INTO widgets (name) VALUES ('one'), ('two')");
    await setup.disconnect();
  });

  afterAll(() => {
    rmSync(DB_PATH, { force: true });
  });

  test("a stream is the operation that connects a lazy data source", async () => {
    const sql = new SqlDataSource({
      type: "sqlite",
      database: DB_PATH,
      logs: false,
      lazyLoad: true,
    });

    try {
      expect(sql.isConnected).toBe(false);

      // Streaming is the very first thing this instance does. Without the
      // ensureConnected call it throws CONNECTION_NOT_ESTABLISHED, since
      // lazyLoad only auto-connects on the paths that call it.
      const stream = await sql
        .from("widgets")
        .select("name")
        .orderBy("name", "asc")
        .stream();

      const names: string[] = [];
      for await (const row of stream) {
        names.push((row as { name: string }).name);
      }

      expect(names).toEqual(["one", "two"]);
      expect(sql.isConnected).toBe(true);
    } finally {
      await sql.disconnect();
    }
  });
});
