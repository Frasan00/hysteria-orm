import { env } from "../../../src/env/env";
import { HysteriaError } from "../../../src/errors/hysteria_error";
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
  await SqlDataSource.disconnect();
});

describe(`[${env.DB_TYPE}] Query Builder with embedded models with cloned connection`, () => {
  test("Embedding should work with cloned connection", async () => {
    const clonedSql = await sql.clone({ shouldRecreatePool: true });
    await clonedSql.startGlobalTransaction();
    await clonedSql.models.userWithoutPk.insert(
      {
        name: "John",
      },
      { connection: clonedSql },
    );

    const user = await clonedSql.models.userWithoutPk
      .query({ connection: clonedSql })
      .first();
    expect(user).toBeDefined();
    expect(user?.name).toBe("John");

    await clonedSql.rollbackGlobalTransaction();
    await clonedSql.closeConnection();
  });
});
