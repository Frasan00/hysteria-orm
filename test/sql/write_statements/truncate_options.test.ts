/**
 * Truncate options. PostgreSQL owns the syntax; every other dialect has to reject it at
 * the SQL boundary instead of emitting a statement its driver would refuse. SQLite has no
 * TRUNCATE at all and keeps its DELETE FROM fallback.
 */

import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import type { SqlDataSourceType } from "../../../src/sql/sql_data_source_types";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserWithoutPk } from "../test_models/without_pk/user_without_pk";

let sql: SqlDataSource;

const dbType = env.DB_TYPE as SqlDataSourceType;
const isPostgres = dbType === "postgres";
// CockroachDB's TRUNCATE grammar carries CASCADE but not the identity options.
const supportsCascade = isPostgres || dbType === "cockroachdb";

const sqlOf = (operation: { toSql: () => { sql: string } }) =>
  operation.toSql().sql;

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

describe(`[${env.DB_TYPE}] truncate options`, () => {
  // users_without_pk has no incoming foreign key, so a plain TRUNCATE is allowed on every
  // dialect; PostgreSQL and MySQL refuse to truncate a table another table references.
  test("a bare truncate empties the table", async () => {
    await UserFactory.userWithoutPk(sql, 2);
    expect(await sql.from(UserWithoutPk).getCount()).toBe(2);

    await sql.from(UserWithoutPk).truncate();

    expect(await sql.from(UserWithoutPk).getCount()).toBe(0);
  });

  test("restart identity runs where the dialect has it", async () => {
    if (!isPostgres) {
      expect(() =>
        sqlOf(sql.from(UserWithoutPk).truncate({ restartIdentity: true })),
      ).toThrow(/TRUNCATE_OPTION_NOT_SUPPORTED/);
      return;
    }

    await UserFactory.userWithoutPk(sql, 1);
    await sql.from(UserWithoutPk).truncate({ restartIdentity: true });

    expect(await sql.from(UserWithoutPk).getCount()).toBe(0);
  });

  test("cascade runs where the dialect has it", async () => {
    if (!supportsCascade) {
      expect(() =>
        sqlOf(sql.from(UserWithoutPk).truncate({ cascade: true })),
      ).toThrow(/TRUNCATE_OPTION_NOT_SUPPORTED/);
      return;
    }

    await UserFactory.userWithoutPk(sql, 1);
    await sql.from(UserWithoutPk).truncate({ cascade: true });

    expect(await sql.from(UserWithoutPk).getCount()).toBe(0);
  });
});
