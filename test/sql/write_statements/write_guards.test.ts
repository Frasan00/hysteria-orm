/**
 * Regression guards for the write-path clauses. Joins, select-only clauses and
 * ORDER BY/LIMIT used to be silently dropped (or emitted as invalid SQL); they now
 * throw. MySQL's DELETE ... LIMIT is the one dialect that keeps the clause, so the
 * data-loss case is asserted by row count rather than by SQL text.
 */

import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import type { SqlDataSourceType } from "../../../src/sql/sql_data_source_types";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserWithUuid } from "../test_models/uuid/schema";

let sql: SqlDataSource;

const dbType = env.DB_TYPE as SqlDataSourceType;
const isMysqlFamily = dbType === "mysql" || dbType === "mariadb";

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

describe(`[${env.DB_TYPE}] write guards`, () => {
  test("rejects a join on update and delete outside mysql", () => {
    const update = () =>
      sql
        .from(UserWithUuid)
        .leftJoin(
          "posts_with_uuid",
          "posts_with_uuid.user_id",
          "users_with_uuid.id",
        )
        .update({ name: "x" })
        .toSql();

    const remove = () =>
      sql
        .from(UserWithUuid)
        .innerJoin(
          "posts_with_uuid",
          "posts_with_uuid.user_id",
          "users_with_uuid.id",
        )
        .delete()
        .toSql();

    // mysql and mariadb are the only dialects whose multi-table write syntax takes joins
    if (isMysqlFamily) {
      expect(update().sql).toContain("left join `posts_with_uuid`");
      expect(remove().sql).toContain("inner join `posts_with_uuid`");
      return;
    }

    expect(update).toThrow(/JOIN_NOT_SUPPORTED_ON_WRITE/);
    expect(remove).toThrow(/JOIN_NOT_SUPPORTED_ON_WRITE/);
  });

  test("rejects select-only clauses on writes", () => {
    expect(() =>
      sql.from(UserWithUuid).distinct().update({ name: "x" }),
    ).toThrow(/SELECT_ONLY_CLAUSE_ON_WRITE/);
    expect(() => sql.from(UserWithUuid).groupBy("id").delete()).toThrow(
      /SELECT_ONLY_CLAUSE_ON_WRITE/,
    );
  });

  test("rejects an update with no columns", () => {
    expect(() => sql.from(UserWithUuid).update({})).toThrow(
      /UPDATE_REQUIRES_COLUMNS/,
    );
  });

  test("keeps order by and limit on mysql, rejects them elsewhere", () => {
    if (!isMysqlFamily) {
      expect(() =>
        sql.from(UserWithUuid).orderBy("id", "desc").update({ name: "x" }),
      ).toThrow(/ORDER_BY_LIMIT_NOT_SUPPORTED_ON_WRITE/);
      expect(() => sql.from(UserWithUuid).limit(1).delete()).toThrow(
        /ORDER_BY_LIMIT_NOT_SUPPORTED_ON_WRITE/,
      );
      return;
    }

    expect(
      sqlOf(sql.from(UserWithUuid).orderBy("id", "desc").update({ name: "x" })),
    ).toContain("order by");
    expect(sqlOf(sql.from(UserWithUuid).limit(1).delete())).toContain("limit");
  });

  test("mysql delete ... limit deletes only the limited rows", async () => {
    if (!isMysqlFamily) {
      return;
    }

    await UserFactory.userWithUuid(sql, 3);
    const before = await sql.from(UserWithUuid).getCount();

    await sql.from(UserWithUuid).limit(1).delete();

    expect(await sql.from(UserWithUuid).getCount()).toBe(before - 1);
  });

  test("keeps bindings on a raw set operation", () => {
    const { sql: rendered, bindings } = sql
      .from(UserWithUuid)
      .select("id")
      .union("select ? as id", [1])
      .toSql();

    expect(rendered).toContain("union");
    expect(bindings).toContain(1);
  });
});

function sqlOf(operation: { toSql: () => { sql: string } }): string {
  return operation.toSql().sql;
}
