import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserWithoutPk } from "../test_models/without_pk/user_without_pk";

let sql: SqlDataSource;

beforeAll(async () => {
  sql = new SqlDataSource();
  await sql.connect();
});

afterAll(async () => {
  await sql.disconnect();
});

beforeEach(async () => {
  const users = await sql.from(UserWithoutPk).many();
  expect(users.length).toBe(0);
  await sql.from(UserWithoutPk).delete();
});

afterEach(async () => {
  await sql.from(UserWithoutPk).delete();
  const users = await sql.from(UserWithoutPk).many();
  expect(users.length).toBe(0);
});

describe(`[${env.DB_TYPE}] logicalSourceId semantics`, () => {
  test("clone shares logicalSourceId with its parent", async () => {
    const child = await sql.clone();
    expect((child as any).logicalSourceId).toBe((sql as any).logicalSourceId);
  });

  test("two independently-constructed sources have different logicalSourceId", () => {
    const a = new SqlDataSource();
    const b = new SqlDataSource();
    expect((a as any).logicalSourceId).not.toBe((b as any).logicalSourceId);
  });

  const testSkipSQLite = env.DB_TYPE === "sqlite" ? test.skip : test;

  testSkipSQLite(
    "child clone joins parent's ALS-active transaction",
    async () => {
      // F006/F016 invariant: a clone of `sql` must join the parent's in-flight
      // ALS transaction, not start a new one. The ALS guard checks
      // (alsTrx.sql.logicalSourceId === this.logicalSourceId), so a clone
      // (which shares logicalSourceId) routes through the parent's tx.
      const child = await sql.clone();

      await sql.transaction(async () => {
        await child
          .from(UserWithoutPk)
          .insert({ ...UserFactory.getCommonUserData() });
      });

      const users = await sql.from(UserWithoutPk).many();
      expect(users.length).toBe(1);
    },
  );
});
