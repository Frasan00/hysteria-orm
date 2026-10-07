/**
 * End-to-end coverage for CTEs attached to writes. The CTE is referenced by the write's
 * own where clause or source select, so the statement only succeeds if the WITH clause
 * really renders ahead of the write; MySQL/MariaDB only take a CTE on INSERT ... SELECT.
 */

import { randomUUID } from "node:crypto";
import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import type { SqlDataSourceType } from "../../../src/sql/sql_data_source_types";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserWithoutPk } from "../test_models/without_pk/user_without_pk";
import { UserWithUuid } from "../test_models/uuid/schema";

let sql: SqlDataSource;

const dbType = env.DB_TYPE as SqlDataSourceType;
const isMysqlFamily = dbType === "mysql" || dbType === "mariadb";
// MySQL 8 and the other dialects take a CTE on UPDATE/DELETE; MariaDB only takes one on SELECT.
const noCteOnWrite = dbType === "mariadb";

beforeAll(async () => {
  sql = new SqlDataSource();
  await sql.connect();
});

afterAll(async () => {
  await sql.disconnect();
});

beforeEach(async () => {
  await sql.startGlobalTransaction();
});

afterEach(async () => {
  await sql.rollbackGlobalTransaction();
});

describe(`[${env.DB_TYPE}] CTEs on writes`, () => {
  test("a CTE drives an update", async () => {
    if (noCteOnWrite) {
      expect(() =>
        sql
          .from(UserWithUuid)
          .with("target", (qb) => qb.select("id"))
          .update({ name: "x" }),
      ).toThrow(/CTE_NOT_SUPPORTED_ON_WRITE/);
      return;
    }

    const user = await UserFactory.userWithUuid(sql, 1);

    await sql
      .from(UserWithUuid)
      .with("target", (qb) => qb.select("id").where("id", user.id))
      .whereIn("id", (qb) => qb.select("id").fromRaw("target"))
      .update({ name: "Updated via CTE" });

    const updated = await sql
      .from(UserWithUuid)
      .where("id", user.id)
      .oneOrFail();
    expect(updated.name).toBe("Updated via CTE");
  });

  test("a CTE drives a delete", async () => {
    if (noCteOnWrite) {
      expect(() =>
        sql
          .from(UserWithUuid)
          .with("target", (qb) => qb.select("id"))
          .delete(),
      ).toThrow(/CTE_NOT_SUPPORTED_ON_WRITE/);
      return;
    }

    const user = await UserFactory.userWithUuid(sql, 1);

    await sql
      .from(UserWithUuid)
      .with("target", (qb) => qb.select("id").where("id", user.id))
      .whereIn("id", (qb) => qb.select("id").fromRaw("target"))
      .delete();

    expect(await sql.from(UserWithUuid).where("id", user.id).getCount()).toBe(
      0,
    );
  });

  test("a CTE feeds an insert ... select on every dialect", async () => {
    await UserFactory.userWithoutPk(sql, 1);

    await sql
      .from(UserWithoutPk)
      .with("src", (qb) => qb.select("name", "password"))
      .insertFrom(["name", "password"], (qb) =>
        qb.select("name", "password").fromRaw("src"),
      );

    expect(await sql.from(UserWithoutPk).getCount()).toBe(2);
  });

  test("a CTE on a values insert works outside mysql", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);

    if (isMysqlFamily) {
      expect(() =>
        sql
          .from(UserWithUuid)
          .with("src", (qb) => qb.select("id"))
          .insert({ id: randomUUID(), name: user.name })
          .toSql(),
      ).toThrow(/CTE_NOT_SUPPORTED_ON_INSERT/);
      return;
    }

    const id = randomUUID();
    await sql
      .from(UserWithUuid)
      .with("src", (qb) => qb.select("id").where("id", user.id))
      .insert({ id, name: "Inserted with a CTE" });

    const inserted = await sql.from(UserWithUuid).where("id", id).oneOrFail();
    expect(inserted.name).toBe("Inserted with a CTE");
  });

  test("a CTE with an explicit column list renders and runs", async () => {
    if (noCteOnWrite) {
      return;
    }

    const user = await UserFactory.userWithUuid(sql, 1);

    await sql
      .from(UserWithUuid)
      .with("target", ["id"], (qb) => qb.select("id").where("id", user.id))
      .whereIn("id", (qb) => qb.select("id").fromRaw("target"))
      .update({ name: "Named CTE columns" });

    const updated = await sql
      .from(UserWithUuid)
      .where("id", user.id)
      .oneOrFail();
    expect(updated.name).toBe("Named CTE columns");
  });

  test("a CTE on truncate is rejected", () => {
    expect(() =>
      sql
        .from(UserWithUuid)
        .with("src", (qb) => qb.select("id"))
        .truncate(),
    ).toThrow(/CTE_NOT_SUPPORTED_ON_TRUNCATE/);
  });
});
