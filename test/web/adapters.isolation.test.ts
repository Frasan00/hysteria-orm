import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { SqlDataSourceInput } from "../../src/sql/sql_data_source_types";
import {
  SqliteRnDriverAdapter,
  type SqliteRnEngine,
} from "../../src/drivers/adapters/web/sqlite_rn.adapter";
import {
  SqliteWasmDriverAdapter,
  type SqliteWasmInitConfig,
} from "../../src/drivers/adapters/web/sqlite_wasm.adapter";

type Call = { method: string; sql: string; bind?: unknown[] };

const makeFakeDb = (calls: Call[], changes = 3) => ({
  exec(sql: string, opts?: { bind?: unknown[] }): void {
    calls.push({ method: "exec", sql, bind: opts?.bind });
  },
  selectObjects(sql: string, bind?: unknown[]): Record<string, unknown>[] {
    calls.push({ method: "selectObjects", sql, bind });
    return [{ id: 1 }, { id: 2 }];
  },
  changes(): number {
    return changes;
  },
  close(): void {
    calls.push({ method: "close", sql: "" });
  },
});

const sqliteInput = (database?: string): SqlDataSourceInput<"sqlite"> =>
  ({ type: "sqlite", database }) as unknown as SqlDataSourceInput<"sqlite">;

const runOptions = (mode?: string, withModel = false) =>
  ({
    returning: "rows",
    sqlLiteOptions: {
      mode,
      ...(withModel ? { typeofModel: class Foo {} } : {}),
    },
  }) as never;

describe("SqliteWasmDriverAdapter (browser)", () => {
  const setup = async (
    database?: string,
    changes = 3,
    withOpfs = true,
  ): Promise<{
    adapter: SqliteWasmDriverAdapter;
    calls: Call[];
    constructions: string[];
  }> => {
    const calls: Call[] = [];
    const constructions: string[] = [];
    const fakeDb = makeFakeDb(calls, changes);

    const loader = async (_config?: SqliteWasmInitConfig) => ({
      DB: class {
        constructor() {
          constructions.push("DB");
        }
        exec = fakeDb.exec;
        selectObjects = fakeDb.selectObjects;
        changes = fakeDb.changes;
        close = fakeDb.close;
      },
      OpfsDb: withOpfs
        ? class {
            constructor() {
              constructions.push("OpfsDb");
            }
            exec = fakeDb.exec;
            selectObjects = fakeDb.selectObjects;
            changes = fakeDb.changes;
            close = fakeDb.close;
          }
        : undefined,
    });

    const adapter = new SqliteWasmDriverAdapter(
      "sqlite",
      sqliteInput(database),
      loader,
    );
    await adapter.createPool();
    return { adapter, calls, constructions };
  };

  it("opens an in-memory DB when no database is given", async () => {
    const { adapter, constructions } = await setup();
    expect(adapter.dialect).toBe("sqlite");
    expect(adapter.jsEnvironment).toBe("web");
    expect(constructions).toEqual(["DB"]);
  });

  it("opens :memory: in memory and a real filename through OPFS", async () => {
    expect((await setup(":memory:")).constructions).toEqual(["DB"]);
    expect((await setup("app.sqlite")).constructions).toEqual(["OpfsDb"]);
  });

  it("falls back to DB when the OPFS VFS is unavailable", async () => {
    expect((await setup("app.sqlite", 3, false)).constructions).toEqual(["DB"]);
  });

  it("runs transactional keywords and returns the change count", async () => {
    const { adapter, calls } = await setup();
    for (const sql of ["BEGIN TRANSACTION", "COMMIT", "ROLLBACK", "begin"]) {
      expect(await adapter.execute(sql, [], runOptions())).toBe(3);
    }
    expect(calls.every((c) => c.method === "exec")).toBe(true);
  });

  it("selects rows in fetch mode", async () => {
    const { adapter, calls } = await setup();
    expect(
      await adapter.execute("SELECT 1", [7], runOptions("fetch")),
    ).toEqual([{ id: 1 }, { id: 2 }]);
    expect(calls[0]).toEqual({
      method: "selectObjects",
      sql: "SELECT 1",
      bind: [7],
    });
  });

  it("returns the change count when there is no model to hydrate", async () => {
    const { adapter, calls } = await setup();
    expect(await adapter.execute("UPDATE t", [], runOptions("raw"))).toBe(3);
    expect(calls[0].method).toBe("exec");
  });

  it("uses RETURNING * for insert modes", async () => {
    const { adapter, calls } = await setup();
    for (const mode of ["insertOne", "insertMany"]) {
      await adapter.execute("INSERT INTO t", [], runOptions(mode, true));
      expect(calls[calls.length - 1]).toEqual({
        method: "selectObjects",
        sql: "INSERT INTO t returning *",
        bind: [],
      });
    }
  });

  it("returns the change count for non-insert modes with a model", async () => {
    const { adapter, calls } = await setup();
    await adapter.execute("UPDATE t", [], runOptions("affectedRows", true));
    expect(calls[0].method).toBe("exec");
  });

  it("wraps a scalar extract in an array only for returning: raw", async () => {
    const { adapter } = await setup();
    expect(adapter.extract(5 as never, "raw")).toEqual([5]);
    expect(adapter.extract([1] as never, "raw")).toEqual([1]);
    expect(adapter.extract([{ a: 1 }] as never, "rows")).toEqual([{ a: 1 }]);
  });

  it("streams rows in order through onData", async () => {
    const { adapter } = await setup();
    const seen: unknown[] = [];
    await adapter.stream("SELECT 1", [], {}, {
      onData: (_pt, row) => {
        seen.push(row);
      },
    });
    expect(seen).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("refuses to query before the pool exists", async () => {
    const adapter = new SqliteWasmDriverAdapter("sqlite", sqliteInput(), async () => ({
      DB: class {
        exec() {}
        selectObjects() {
          return [];
        }
        changes() {
          return 0;
        }
        close() {}
      },
    }));
    await expect(adapter.execute("SELECT 1", [], runOptions())).rejects.toThrow(
      /createPool/,
    );
  });
});

describe("SqliteRnDriverAdapter (react-native)", () => {
  const setup = async (
    rows: unknown,
    rowsAffected = 2,
    database?: string,
  ): Promise<{ adapter: SqliteRnDriverAdapter; calls: Call[]; names: string[] }> => {
    const calls: Call[] = [];
    const names: string[] = [];
    const engine: SqliteRnEngine = {
      open({ name }) {
        names.push(name);
        return {
          async execute(sql: string, bind?: unknown[]) {
            calls.push({ method: "execute", sql, bind });
            return { rows, rowsAffected };
          },
          close() {
            calls.push({ method: "close", sql: "" });
          },
        };
      },
    };
    const adapter = new SqliteRnDriverAdapter(
      "sqlite",
      sqliteInput(database),
      engine,
    );
    adapter.createPool();
    return { adapter, calls, names };
  };

  it("opens the configured file name", async () => {
    const { adapter, names } = await setup([], 2, "app.db");
    expect(adapter.jsEnvironment).toBe("react-native");
    expect(names).toEqual(["app.db"]);
  });

  it("normalizes the JSI host-object row array in fetch mode", async () => {
    const arrayLike = { _array: [{ id: 1 }], length: 1 };
    const { adapter } = await setup(arrayLike);
    expect(
      await adapter.execute("SELECT 1", [], runOptions("fetch")),
    ).toEqual([{ id: 1 }]);
  });

  it("passes a plain row array through untouched", async () => {
    const { adapter } = await setup([{ id: 9 }]);
    expect(await adapter.execute("SELECT 1", [], runOptions("fetch"))).toEqual([{ id: 9 }]);
  });

  it("normalizes rows for insert modes too", async () => {
    const { adapter, calls } = await setup({ _array: [{ id: 4 }], length: 1 });
    await expect(
      adapter.execute("INSERT INTO t", [], runOptions("insertOne", true)),
    ).resolves.toEqual([{ id: 4 }]);
    expect(calls[calls.length - 1]?.sql).toBe("INSERT INTO t returning *");
  });

  it("returns rowsAffected for DML and transactions", async () => {
    const { adapter, calls } = await setup([], 7);
    expect(await adapter.execute("BEGIN TRANSACTION", [], runOptions())).toBe(7);
    await expect(
      adapter.execute("DELETE FROM t", [], runOptions("affectedRows", true)),
    ).resolves.toBe(7);
    expect(calls[0].method).toBe("execute");
  });

  it("defaults rowsAffected to 0 rather than undefined", async () => {
    const engine: SqliteRnEngine = {
      open: () => ({
        async execute() {
          return {};
        },
        close() {},
      }),
    };
    const adapter = new SqliteRnDriverAdapter("sqlite", sqliteInput(), engine);
    adapter.createPool();
    await expect(
      adapter.execute("UPDATE t", [], runOptions("affectedRows", true)),
    ).resolves.toBe(0);
  });

  it("streams rows in order through onData", async () => {
    const { adapter } = await setup({ _array: [{ id: 1 }, { id: 2 }], length: 2 });
    const seen: unknown[] = [];
    await adapter.stream("SELECT 1", [], {}, {
      onData: (_pt, row) => {
        seen.push(row);
      },
    });
    expect(seen).toEqual([{ id: 1 }, { id: 2 }]);
  });
});

describe("web drivers stay free of node builtins", () => {
  const dir = join(process.cwd(), "src/drivers/adapters/web");

  it("imports no node builtin at runtime, directly or transitively", () => {
    const offenders: string[] = [];

    for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
      const source = readFileSync(join(dir, file), "utf8");

      // `import type` is erased before runtime, so only value imports count.
      const valueNodeImports = source.match(/^import\s+(?!type\b).*"node:/gm);
      if (valueNodeImports) {
        offenders.push(`${file}: ${valueNodeImports.join(", ")}`);
      }
      if (/require\("node:/.test(source)) {
        offenders.push(`${file}: require("node:…")`);
      }

      // The one sanctioned escape hatch: the shared PassThrough helper. It is
      // the tracked browser-bundle gap — nothing else may reach outside the dir.
      const escapes =
        source.match(/from\s+"\.\.\/(\w+)\/[\w./]+"/g)?.filter(
          (m) => !m.includes('"../bun/stream_utils"'),
        ) ?? [];
      if (escapes.length) {
        offenders.push(`${file}: ${escapes.join(", ")}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
