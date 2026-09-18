import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { env } from "../../src/env/env";
import { DriverFactory } from "../../src/drivers/drivers_factory";
import { MssqlDriverAdapter } from "../../src/drivers/adapters/node/mssql.adapter";
import { Mysql2DriverAdapter } from "../../src/drivers/adapters/node/mysql2.adapter";
import { PgDriverAdapter } from "../../src/drivers/adapters/node/pg.adapter";
import { Sqlite3DriverAdapter } from "../../src/drivers/adapters/node/sqlite3.adapter";
import type { DriverAdapterFactory } from "../../src/drivers/driver_adapter_registry";
import type { DriverAdapter } from "../../src/drivers/driver_adapter";
import { SqlDataSource } from "../../src/sql/sql_data_source";
import type { SqlDataSourceType } from "../../src/sql/sql_data_source_types";
import { col, defineModel } from "../../src/sql/models/define_model";

const TABLE = "__custom_driver_test__";
const dbType = env.DB_TYPE as SqlDataSourceType;

// File-backed, not ":memory:": clone() always builds a fresh sqlite pool, so an
// in-memory database would leave every clone (and every transaction, which
// clones) looking at an empty table. Server dialects read the live config.
const DB_PATH = path.resolve(tmpdir(), `hysteria-custom-driver-${Date.now()}.db`);

type AnyAdapterCtor = new (
  dialect: never,
  input: never,
  client: never,
) => DriverAdapter<never>;

const SHIPPED_ADAPTERS: Partial<Record<SqlDataSourceType, AnyAdapterCtor>> = {
  sqlite: Sqlite3DriverAdapter as unknown as AnyAdapterCtor,
  postgres: PgDriverAdapter as unknown as AnyAdapterCtor,
  cockroachdb: PgDriverAdapter as unknown as AnyAdapterCtor,
  mysql: Mysql2DriverAdapter as unknown as AnyAdapterCtor,
  mariadb: Mysql2DriverAdapter as unknown as AnyAdapterCtor,
  mssql: MssqlDriverAdapter as unknown as AnyAdapterCtor,
};

const Row = defineModel(TABLE, {
  columns: {
    id: col.integer({ primaryKey: true }),
    name: col.string(),
  },
});

/**
 * Wraps whichever shipped adapter serves the active dialect in an inline
 * factory: the engine is real, only the selection path is custom. The name is
 * deliberately one no registry entry uses, so a query succeeding proves
 * resolution went through the factory rather than the registered driver.
 */
const wrapShippedAdapter = (
  dialect: SqlDataSourceType,
  onCreate: () => void,
): DriverAdapterFactory<SqlDataSourceType> => ({
  name: `inline-${dialect}`,
  dialects: [dialect],
  create: async ({ dialect: resolved, input }) => {
    onCreate();
    const AdapterCtor = SHIPPED_ADAPTERS[resolved];
    if (!AdapterCtor) {
      throw new Error(`no shipped adapter to wrap for "${resolved}"`);
    }
    // Same client the registry would have used; only the constructor call is ours.
    const { client } = await DriverFactory.getDriver(resolved);
    return new AdapterCtor(
      resolved as never,
      input as never,
      client as never,
    );
  },
});

const connectionInput = (): Record<string, unknown> =>
  dbType === "sqlite"
    ? { type: dbType, database: DB_PATH }
    : {
        type: dbType,
        host: env.DB_HOST,
        port: Number(env.DB_PORT),
        username: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_DATABASE,
      };

describe(`[${dbType}] custom driver factories`, () => {
  let sql: SqlDataSource;
  let creates = 0;

  const connect = async (): Promise<void> => {
    creates = 0;
    sql = new SqlDataSource({
      ...connectionInput(),
      driver: wrapShippedAdapter(dbType, () => creates++),
    } as never);
    await sql.connect();

    await sql.schema().dropTable(TABLE, true);
    await sql.schema().createTable(TABLE, (table) => {
      const id = table.increment("id");
      // mysql/mariadb need the auto-increment column to also be a key; sqlite
      // errors with "more than one primary key" if it is (already one there).
      if (dbType === "mysql" || dbType === "mariadb") {
        id.primaryKey();
      }
      table.varchar("name", 100);
    });
  };

  afterEach(async () => {
    if (sql?.isConnected) {
      await sql.schema().dropTable(TABLE, true);
      await sql.disconnect();
    }
  });

  afterAll(() => {
    if (dbType !== "sqlite") {
      return;
    }
    for (const suffix of ["", "-shm", "-wal"]) {
      rmSync(`${DB_PATH}${suffix}`, { force: true });
    }
  });

  test("the factory builds the adapter and its pool runs real queries", async () => {
    await connect();
    expect(creates).toBe(1);

    // RETURNING came back, so the generated id round-tripped through the
    // adapter's insert path rather than a follow-up select.
    const inserted = await sql
      .from(Row)
      .insert({ name: "first" }, { returning: ["id"] });
    expect(inserted.id).toBeDefined();

    const rows = await sql.from(TABLE).many();
    expect(rows).toHaveLength(1);
    expect((rows[0] as { name: string }).name).toBe("first");
  });

  test("writes report affected rows through the factory adapter", async () => {
    await connect();
    await sql.from(Row).insertMany([{ name: "a" }, { name: "b" }]);

    const updated = await sql.from(Row).where("name", "a").update({
      name: "c",
    });
    expect(updated).toBe(1);

    const deleted = await sql.from(Row).where("name", "b").delete();
    expect(deleted).toBe(1);

    expect(await sql.from(TABLE).getCount()).toBe(1);
  });

  test("transactions run on the factory's connection", async () => {
    await connect();

    await sql.transaction(async () => {
      await sql.from(Row).insert({ name: "kept" });
    });
    await expect(
      sql.transaction(async () => {
        await sql.from(Row).insert({ name: "rolled-back" });
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    const rows = await sql.from(TABLE).many();
    expect(rows.map((r) => (r as { name: string }).name)).toEqual(["kept"]);
  });

  test("a clone re-runs the factory for its own adapter", async () => {
    await connect();
    expect(creates).toBe(1);

    const cloned = await sql.clone({ shouldRecreatePool: true });
    expect(creates).toBe(2);
    expect(cloned.getDbType()).toBe(dbType);
    await cloned.disconnect();
  });

  test("a factory that omits the configured dialect is rejected", async () => {
    const wrong = dbType === "postgres" ? "mysql" : "postgres";
    const sql2 = new SqlDataSource({
      type: dbType,
      database: dbType === "sqlite" ? ":memory:" : env.DB_DATABASE,
      driver: {
        name: "wrong-dialect",
        dialects: [wrong],
        create: () => ({}) as never,
      } as never,
    });

    await expect(sql2.connect()).rejects.toThrow(
      new RegExp(`wrong-dialect.*does not support dialect "${dbType}"`),
    );
  });
});
