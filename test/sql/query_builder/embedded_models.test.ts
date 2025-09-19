import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { HysteriaError } from "../../../src/errors/hysteria_error";
import { AugmentedSqlDataSource } from "../sql_data_source_types";
import { UserWithoutPk } from "../test_models/without_pk/user_without_pk";

let sql: AugmentedSqlDataSource<{
  userWithoutPk: typeof UserWithoutPk;
}>;

beforeAll(async () => {
  sql = await SqlDataSource.connect({
    models: {
      userWithoutPk: UserWithoutPk,
    },
  });
});

afterAll(async () => {
  await SqlDataSource.disconnect();
});

describe(`[${env.DB_TYPE}] Query Builder with embedded models`, () => {
  test("should fail if a model key is already used by the sql data source instance", async () => {
    expect(async () => {
      await SqlDataSource.connect({
        models: {
          connect: UserWithoutPk,
        },
      });
    }).rejects.toThrow(HysteriaError);
  });

  test("Embedding should work with normal default connection", async () => {
    await sql.startGlobalTransaction();
    await sql.userWithoutPk.insert({
      name: "John",
    });

    const user = await sql.userWithoutPk.query().first();
    expect(user).toBeDefined();
    expect(user?.name).toBe("John");

    await sql.rollbackGlobalTransaction();
    await sql.closeConnection();
  });

  test("Embedding should work with secondary connection", async () => {
    const anotherSql = await SqlDataSource.connectToSecondarySource({
      models: {
        userWithoutPk: UserWithoutPk,
      },
    });

    await anotherSql.startGlobalTransaction();
    await anotherSql.userWithoutPk.insert(
      {
        name: "John",
      },
      {
        connection: anotherSql,
      },
    );

    const user = await anotherSql.userWithoutPk
      .query({
        connection: anotherSql,
      })
      .first();
    expect(user).toBeDefined();
    expect(user?.name).toBe("John");

    await anotherSql.rollbackGlobalTransaction();
    await anotherSql.closeConnection();
  });

  test("Embedding should work with useConnection", async () => {
    await SqlDataSource.useConnection(
      {
        type: env.DB_TYPE as any,
        host: env.DB_HOST as string,
        port: Number(env.DB_PORT),
        username: env.DB_USER as string,
        password: env.DB_PASSWORD as string,
        database: env.DB_DATABASE as string,
        models: {
          userWithoutPk: UserWithoutPk,
        },
      },
      async (sql) => {
        await sql.startGlobalTransaction();
        await sql.userWithoutPk.insert(
          {
            name: "John",
          },
          {
            connection: sql,
          },
        );

        const user = await sql.userWithoutPk
          .query({
            connection: sql,
          })
          .first();
        expect(user).toBeDefined();
        expect(user?.name).toBe("John");

        await sql.rollbackGlobalTransaction();
        await sql.closeConnection();
      },
    );
  });
});
