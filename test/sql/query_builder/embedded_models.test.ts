import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { SqlDataSourceType } from "../../../src/sql/sql_data_source_types";
import { UserWithoutPk } from "../test_models/without_pk/user_without_pk";

let sql: SqlDataSource<
  SqlDataSourceType,
  { userWithoutPk: typeof UserWithoutPk }
>;

beforeAll(async () => {
  sql = new SqlDataSource({
    type: env.DB_TYPE as any,
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE,
    models: {
      userWithoutPk: UserWithoutPk,
    },
  } as any) as typeof sql;
  await sql.connect();
});

afterAll(async () => {
  await sql.disconnect();
});

describe(`[${env.DB_TYPE}] Query Builder with embedded models with cloned connection`, () => {
  test("Embedding should work with cloned connection", async () => {
    const clonedSql = await sql.clone({ shouldRecreatePool: true });
    await clonedSql.startGlobalTransaction();
    await clonedSql.from(UserWithoutPk).insert({
      name: "John",
    });

    const user = await clonedSql.from(UserWithoutPk).one();
    expect(user).toBeDefined();
    expect(user?.name).toBe("John");

    await clonedSql.rollbackGlobalTransaction();
    await clonedSql.disconnect();
  });
});

describe(`[${env.DB_TYPE}] sql.models proxy`, () => {
  beforeEach(async () => {
    await sql.startGlobalTransaction();
  });

  afterEach(async () => {
    await sql.rollbackGlobalTransaction();
  });

  test("sql.models.X should return a ModelQueryBuilder (no sql.from needed)", async () => {
    await sql.models.userWithoutPk.insert({ name: "ProxyUser" });
    const user = await sql.models.userWithoutPk
      .where("name", "ProxyUser")
      .one();
    expect(user).toBeDefined();
    expect(user?.name).toBe("ProxyUser");
  });

  test("each sql.models.X access returns a fresh builder", async () => {
    await sql.models.userWithoutPk.insert({ name: "A", email: "a@test.com" });
    await sql.models.userWithoutPk.insert({ name: "B", email: "b@test.com" });
    const users = await sql.models.userWithoutPk.many();
    expect(users.length).toBe(2);
  });
});
