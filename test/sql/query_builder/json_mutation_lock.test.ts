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
  await sql.startGlobalTransaction();
});

afterEach(async () => {
  await sql.rollbackGlobalTransaction();
});

const insertUser = (email: string, json: Record<string, unknown>) =>
  sql.from(UserWithoutPk).insert(
    {
      ...UserFactory.getCommonUserData(),
      json,
      email,
    },
    { returning: ["*"] },
  );

const fetchByEmail = (email: string) =>
  sql.from(UserWithoutPk).where("email", email).one();

describe(`[${env.DB_TYPE}] JSON mutation (update)`, () => {
  test("jsonSet replaces an existing value and keeps siblings", async () => {
    const email = `jm-set-${env.DB_TYPE}@test.com`;
    await insertUser(email, { a: 1, b: 2 });

    await sql
      .from(UserWithoutPk)
      .where("email", email)
      .update({ json: sql.jsonSet("json", "$.a", 99) as any });

    expect((await fetchByEmail(email))?.json).toMatchObject({ a: 99, b: 2 });
  });

  test("jsonInsert only adds missing paths", async () => {
    if (env.DB_TYPE === "mssql") return;

    const email = `jm-insert-${env.DB_TYPE}@test.com`;
    await insertUser(email, { a: 1 });

    await sql
      .from(UserWithoutPk)
      .where("email", email)
      .update({ json: sql.jsonInsert("json", "$.c", 3) as any });
    expect((await fetchByEmail(email))?.json).toMatchObject({ a: 1, c: 3 });

    // Already present: value stays untouched
    await sql
      .from(UserWithoutPk)
      .where("email", email)
      .update({ json: sql.jsonInsert("json", "$.a", 999) as any });
    expect((await fetchByEmail(email))?.json).toMatchObject({ a: 1, c: 3 });
  });

  test("jsonRemove deletes a path", async () => {
    if (env.DB_TYPE === "mssql") return;

    const email = `jm-remove-${env.DB_TYPE}@test.com`;
    await insertUser(email, { a: 1, b: 2 });

    await sql
      .from(UserWithoutPk)
      .where("email", email)
      .update({ json: sql.jsonRemove("json", "$.b") as any });

    const row = await fetchByEmail(email);
    expect((row?.json as Record<string, unknown>).a).toBe(1);
    expect((row?.json as Record<string, unknown>).b).toBeUndefined();
  });
});

describe(`[${env.DB_TYPE}] Postgres lock strengths`, () => {
  test("forNoKeyUpdate and forKeyShare select rows", async () => {
    if (env.DB_TYPE !== "postgres") return;

    await insertUser(`lock-${env.DB_TYPE}@test.com`, { a: 1 });

    const noKeyUpdate = await sql.from(UserWithoutPk).forNoKeyUpdate().many();
    expect(noKeyUpdate.length).toBeGreaterThan(0);

    const keyShare = await sql.from(UserWithoutPk).forKeyShare().many();
    expect(keyShare.length).toBeGreaterThan(0);
  });
});
