/// <reference types="bun-types" />
import { describe, expect, it, test } from "bun:test";
import { loadPlatform } from "../../src/platform/platform_adapter";
import { SqlDataSource } from "../../src/sql/sql_data_source";
import { defineModel, col } from "../../src/sql/models/define_model";
import { rmSync } from "node:fs";

const UserSqlite = defineModel("bun_test_users", {
  columns: {
    id: col.integer({ primaryKey: true }),
    name: col.string(),
    age: col.integer(),
    createdAt: col.datetime({ autoCreate: true }),
    updatedAt: col.datetime({ autoCreate: true, autoUpdate: true }),
  },
});

const SQLITE_DDL = `CREATE TABLE IF NOT EXISTS bun_test_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`;

/** Server dialects run against the docker containers; skipped when down. */
const SERVER_CASES: Array<{
  label: string;
  type: "postgres" | "mysql" | "mariadb";
  ddl: string;
}> = [
  {
    label: "postgres",
    type: "postgres",
    ddl: `CREATE TABLE IF NOT EXISTS bun_test_users (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, age INT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
  },
  {
    label: "mysql",
    type: "mysql",
    ddl: `CREATE TABLE IF NOT EXISTS bun_test_users (
      id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, age INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  },
  {
    label: "mariadb",
    type: "mariadb",
    ddl: `CREATE TABLE IF NOT EXISTS bun_test_users (
      id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, age INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  },
];

const PORST: Record<string, { host: string; port: number }> = {
  postgres: { host: "localhost", port: 54321 },
  mysql: { host: "localhost", port: 33061 },
  mariadb: { host: "localhost", port: 33071 },
};

describe("platform probe", () => {
  it("resolves the bun platform under bun", () => {
    const platform = loadPlatform();
    expect(platform.name).toBe("bun");
    expect(typeof platform.fs.writeFile).toBe("function");
    expect(typeof platform.crypto.randomUUID).toBe("function");
  });
});

describe("auto-detected bun sqlite driver", () => {
  it("runs CRUD, transactions and streaming through bun:sqlite", async () => {
    const dbPath = "/tmp/bun_test_sqlite.db";
    rmSync(dbPath, { force: true });
    const sql = new SqlDataSource({
      type: "sqlite",
      database: dbPath,
      logs: false,
    });
    await sql.connect();
    const adapter = sql["driverAdapter"]!;
    expect(adapter.dialect).toBe("sqlite");
    expect(adapter.jsEnvironment).toBe("bun");

    await sql.rawQuery(SQLITE_DDL);
    const mm = sql.getModelManager(UserSqlite);

    const inserted: any = await mm.insert(
      { name: "Al", age: 30 },
      { returning: ["id"] },
    );
    expect(inserted?.id).toBeDefined();

    const trx = await sql.transaction();
    await trx.sql.from(UserSqlite).insert({ name: "Bob", age: 25 });
    await trx.commit();
    expect((await sql.from(UserSqlite).many()).length).toBe(2);

    const trx2 = await sql.transaction();
    await trx2.sql.from(UserSqlite).insert({ name: "Eve", age: 20 });
    await trx2.rollback();
    expect((await sql.from(UserSqlite).many()).length).toBe(2);

    const trx3 = await sql.transaction();
    const nested = await trx3.nestedTransaction();
    await nested.sql.from(UserSqlite).insert({ name: "Nes", age: 1 });
    await nested.rollback();
    await trx3.commit();
    expect((await sql.from(UserSqlite).many()).length).toBe(2);

    const pt = await sql.from(UserSqlite).select("*").stream();
    const rows: any[] = [];
    for await (const row of pt) rows.push(row);
    expect(rows.length).toBe(2);

    const updated = await sql
      .from(UserSqlite)
      .where("name", "Al")
      .update({ age: 31 });
    expect(updated).toBe(1);
    const deleted = await sql.from(UserSqlite).where("name", "Al").delete();
    expect(deleted).toBe(1);
    await sql.disconnect();
  });
});

describe("jsEnvironment override under bun", () => {
  it("builds an npm pool when forced to node", async () => {
    const dbPath = "/tmp/bun_test_node_override.db";
    rmSync(dbPath, { force: true });
    const sql = new SqlDataSource({
      type: "sqlite",
      database: dbPath,
      jsEnvironment: "node",
      logs: false,
    });
    await sql.connect();
    const adapter = sql["driverAdapter"]!;
    expect(adapter.jsEnvironment).toBe("node");
    await sql.rawQuery(SQLITE_DDL);
    await sql.from(UserSqlite).select("*").many();
    await sql.disconnect();
  });
});

/** True when the docker service for a dialect actually responds. */
async function serverUp(
  case_: (typeof SERVER_CASES)[number],
): Promise<boolean> {
  const conn = PORST[case_.type];
  try {
    const sql = new SqlDataSource({
      type: case_.type,
      host: conn.host,
      port: conn.port,
      username: "root",
      password: "root",
      database: "test",
      logs: false,
    });
    await sql.connect();
    await sql.disconnect();
    return true;
  } catch {
    return false;
  }
}

for (const case_ of SERVER_CASES) {
  const available = await serverUp(case_);
  test.skipIf(!available)(`bun native ${case_.label} driver`, async () => {
    const conn = PORST[case_.type];
    const sql = new SqlDataSource({
      type: case_.type,
      host: conn.host,
      port: conn.port,
      username: "root",
      password: "root",
      database: "test",
      logs: false,
    });
    await sql.connect();
    const adapter = sql["driverAdapter"]!;
    expect(adapter.jsEnvironment).toBe("bun");

    await sql.rawQuery(case_.ddl);
    // clean the shared table across repeated runs
    await sql.from(UserSqlite).delete();
    const mm = sql.getModelManager(UserSqlite);
    const inserted: any = await mm.insert(
      { name: "Al", age: 30 },
      { returning: ["id"] },
    );
    expect(inserted?.id).toBeDefined();

    const trx = await sql.transaction();
    await trx.sql.from(UserSqlite).insert({ name: "Bob", age: 25 });
    await trx.commit();
    expect((await sql.from(UserSqlite).many()).length).toBe(2);

    const trx2 = await sql.transaction();
    await trx2.sql.from(UserSqlite).insert({ name: "Eve", age: 20 });
    await trx2.rollback();
    expect((await sql.from(UserSqlite).many()).length).toBe(2);

    const trx3 = await sql.transaction();
    const nested = await trx3.nestedTransaction();
    await nested.sql.from(UserSqlite).insert({ name: "Nes", age: 1 });
    await nested.rollback();
    await trx3.commit();
    expect((await sql.from(UserSqlite).many()).length).toBe(2);

    const updated = await sql
      .from(UserSqlite)
      .where("name", "Al")
      .update({ age: 31 });
    expect(updated).toBe(1);
    const deleted = await sql.from(UserSqlite).where("name", "Al").delete();
    expect(deleted).toBe(1);
    await sql.disconnect();
  });
}
