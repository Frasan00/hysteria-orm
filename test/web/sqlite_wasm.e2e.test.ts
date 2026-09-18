/**
 * End-to-end against the real sqlite-wasm engine under jsdom. The wasm binary is
 * read from disk and handed in as `wasmBinary` because jsdom cannot fetch it —
 * the same option a bundler-less host would use.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import type {
  SqliteWasmDriverAdapter,
  SqliteWasmInitConfig,
} from "../../src/drivers/adapters/web/sqlite_wasm.adapter";
import { registerWebDrivers } from "../../src/drivers/adapters/web";

const require_ = createRequire(import.meta.url);

let wasmBinary: Uint8Array | undefined;
try {
  wasmBinary = new Uint8Array(
    readFileSync(require_.resolve("@sqlite.org/sqlite-wasm/sqlite3.wasm")),
  );
} catch {
  wasmBinary = undefined;
}

const describeMaybe = wasmBinary ? describe : describe.skip;

describeMaybe("sqlite-wasm end to end", () => {
  let adapter: SqliteWasmDriverAdapter;

  const run = async (
    sql: string,
    params: unknown[] = [],
    sqlLiteOptions: Record<string, unknown> = {},
  ): Promise<any> =>
    adapter.execute(sql, params, {
      returning: "rows",
      sqlLiteOptions,
    } as never);

  beforeAll(async () => {
    registerWebDrivers({ wasmBinary } as SqliteWasmInitConfig);
    const { resolveDriverAdapter } = await import(
      "../../src/drivers/driver_adapter_registry"
    );
    adapter = (await resolveDriverAdapter("sqlite", "web", undefined, {
      type: "sqlite",
      database: ":memory:",
    } as never)) as SqliteWasmDriverAdapter;
    await adapter.createPool();
  });

  afterAll(async () => {
    await adapter.closePool();
  });

  it("boots the engine and creates a table", async () => {
    await run("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)");
    expect(await run("SELECT name FROM sqlite_master WHERE type = 'table'")).toEqual([
      { name: "users" },
    ]);
  });

  it("returns DB-generated values through RETURNING *", async () => {
    const inserted = await run(
      "INSERT INTO users (name, age) VALUES (?, ?)",
      ["ada", 36],
      { mode: "insertOne", typeofModel: class User {} },
    );

    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({ id: 1, name: "ada", age: 36 });
  });

  it("reports affected rows for updates and deletes", async () => {
    const updated = await run("UPDATE users SET age = ? WHERE name = ?", [37, "ada"], {
      mode: "affectedRows",
      typeofModel: class User {},
    });
    expect(updated).toBe(1);

    const deleted = await run("DELETE FROM users WHERE name = ?", ["nobody"], {
      mode: "affectedRows",
      typeofModel: class User {},
    });
    expect(deleted).toBe(0);
  });

  it("reads back coerced values", async () => {
    expect(await run("SELECT id, name, age FROM users")).toEqual([
      { id: 1, name: "ada", age: 37 },
    ]);
  });

  it("streams rows in order", async () => {
    await run("INSERT INTO users (name, age) VALUES ('grace', 45)");
    const seen: Record<string, unknown>[] = [];
    await adapter.stream("SELECT name FROM users ORDER BY id", [], {}, {
      onData: (_pt, row) => {
        seen.push(row as Record<string, unknown>);
      },
    });
    expect(seen).toEqual([{ name: "ada" }, { name: "grace" }]);
  });

  it("rolls a transaction back", async () => {
    await run("BEGIN TRANSACTION");
    await run("INSERT INTO users (name) VALUES ('temp')");
    await run("ROLLBACK");
    expect(await run("SELECT COUNT(*) AS n FROM users")).toEqual([{ n: 2 }]);
  });

  it("commits a transaction", async () => {
    await run("BEGIN TRANSACTION");
    await run("INSERT INTO users (name) VALUES ('kept')");
    await run("COMMIT");
    expect(await run("SELECT COUNT(*) AS n FROM users")).toEqual([{ n: 3 }]);
  });

  it("binds text, null, boolean and blob parameters", async () => {
    await run("CREATE TABLE typed (t TEXT, n TEXT, b INTEGER, blob BLOB)");
    await run("INSERT INTO typed VALUES (?, ?, ?, ?)", [
      "text",
      null,
      true,
      new Uint8Array([1, 2, 3]),
    ]);
    const [row] = await run("SELECT t, n, b, typeof(blob) AS kind FROM typed");
    expect(row).toMatchObject({ t: "text", n: null, b: 1, kind: "blob" });
  });
});
