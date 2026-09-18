/**
 * Covers the returning clause on UPDATE/DELETE. Three things are asserted:
 *
 * 1. Round-trip count — the dialects with a usable clause answer the write from it
 *    and skip the follow-up re-fetch; the others still re-fetch by primary key.
 * 2. The SQLite UPDATE gate — its auto-update trigger is AFTER UPDATE, so RETURNING
 *    would hand back the pre-trigger timestamp. SQLite therefore re-fetches on UPDATE
 *    when the model has an autoUpdate column, which the round-trip count catches.
 * 3. `.update(data, returning)` / `.delete(returning)` produce rows at all. They used
 *    to emit the clause before the where nodes, which PostgreSQL rejects outright.
 */

import { randomUUID } from "node:crypto";
import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import type { SqlDataSourceType } from "../../../src/sql/sql_data_source_types";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserWithUuid } from "../test_models/uuid/schema";

let sql: SqlDataSource;
const seen: string[] = [];

const dbType = env.DB_TYPE as SqlDataSourceType;
// MySQL and MariaDB have no UPDATE ... RETURNING, so the builder rejects it at the type
// level; the skipped cases document that rather than silently passing.
const hasUpdateReturning = dbType !== "mysql" && dbType !== "mariadb";
const itIfReturning = hasUpdateReturning ? test : test.skip;
// UserWithUuid declares an autoUpdate column, so SQLite is excluded from the native
// UPDATE path — the trigger there is AFTER UPDATE, so RETURNING would hand back the
// pre-trigger timestamp — and falls back to the re-fetch.
const nativeUpdate = dbType === "postgres" || dbType === "cockroachdb";

beforeAll(async () => {
  sql = new SqlDataSource();
  await sql.connect();
});

afterAll(async () => {
  await sql.disconnect();
});

beforeEach(async () => {
  const trx = await sql.startGlobalTransaction();
  // The transaction runs on a clone of the data source, which does not inherit the
  // observer chain, so the observer has to go on the clone the queries actually use.
  trx.sql.addObserver({
    onBeforeQuery: (ctx) => {
      seen.push(ctx.sql);
    },
  });
  seen.length = 0;
});

afterEach(async () => {
  await sql.rollbackGlobalTransaction();
});

describe(`[${env.DB_TYPE}] updateRecord returning`, () => {
  test("returns the updated row", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);

    const updated = await sql
      .from(UserWithUuid)
      .updateRecord(user.id, { name: "Updated Name" }, { returning: ["*"] });

    expect(updated?.name).toBe("Updated Name");
  });

  test("uses one round trip where the dialect can, two otherwise", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);
    seen.length = 0;

    await sql
      .from(UserWithUuid)
      .updateRecord(user.id, { name: "Updated Name" }, { returning: ["*"] });

    expect(seen.length).toBe(nativeUpdate ? 1 : 2);
  });

  test("no returning leaves the write at a single round trip", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);
    seen.length = 0;

    const result = await sql.from(UserWithUuid).updateRecord(user.id, {
      name: "Updated Name",
    });

    expect(result).toBeUndefined();
    expect(seen.length).toBe(1);
  });

  test("throws ROW_NOT_FOUND when the row does not exist", async () => {
    await expect(
      sql
        .from(UserWithUuid)
        .updateRecord(randomUUID(), { name: "Nope" }, { returning: ["*"] }),
    ).rejects.toThrow(/ROW_NOT_FOUND/);
  });
});

describe(`[${env.DB_TYPE}] builder returning`, () => {
  itIfReturning(
    "update with returning resolves to the updated values",
    async () => {
      const user = await UserFactory.userWithUuid(sql, 1);

      const rows = await sql
        .from(UserWithUuid)
        .where("id", "=", user.id)
        .update({ name: "Updated Name" }, { returning: ["name"] });

      expect(rows).toEqual(expect.objectContaining({ name: "Updated Name" }));
    },
  );

  test("update without returning resolves to the affected row count", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);

    const affected = await sql
      .from(UserWithUuid)
      .where("id", "=", user.id)
      .update({ name: "Updated Name" });

    expect(affected).toBe(1);
  });

  itIfReturning(
    "delete with returning resolves to the deleted values",
    async () => {
      const user = await UserFactory.userWithUuid(sql, 1);
      seen.length = 0;

      const rows = await sql
        .from(UserWithUuid)
        .where("id", "=", user.id)
        .delete({ returning: ["id", "name"] });

      expect(rows).toEqual(
        expect.objectContaining({ id: user.id, name: user.name }),
      );
      expect(seen.length).toBe(1);
    },
  );

  test("delete without returning resolves to the affected row count", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);

    const affected = await sql
      .from(UserWithUuid)
      .where("id", "=", user.id)
      .delete();

    expect(affected).toBe(1);
  });
});
