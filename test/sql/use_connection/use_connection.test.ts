import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { PostWithBigint, UserWithBigint } from "../test_models/bigint/schema";
import { UserFactory } from "../test_models/factory/user_factory";

let sql: SqlDataSource;

describe("useConnection test", () => {
  test("[postgres] should create an on a custom connection", async () => {
    await SqlDataSource.useConnection(
      {
        type: "postgres",
        host: "localhost",
        username: "root",
        password: "root",
        database: "test",
        port: 5432,
      },
      async (sql) => {
        expect(sql.isConnected).toBe(true);
        expect(sql.getDbType()).toBe("postgres");
        await sql.startGlobalTransaction();
        const userWithBigint = await sql.from(UserWithBigint).insert(
          {
            ...UserFactory.getCommonUserData(),
          },
          { returning: ["*"] },
        );

        const post = await sql.from(PostWithBigint).insert(
          {
            title: "Test Post",
            content: "Test Content",
            userId: userWithBigint.id,
          },
          { returning: ["*"] },
        );
        expect(post).toHaveProperty("id");

        await sql.rollbackGlobalTransaction();
      },
    );
  });

  test("[mysql] should create an on a custom connection", async () => {
    await SqlDataSource.useConnection(
      {
        type: "mysql",
        host: "localhost",
        username: "root",
        password: "root",
        database: "test",
        port: 3306,
      },
      async (sql) => {
        expect(sql.isConnected).toBe(true);
        expect(sql.getDbType()).toBe("mysql");
        await sql.startGlobalTransaction();
        const userWithBigint = await sql.from(UserWithBigint).insert(
          {
            ...UserFactory.getCommonUserData(),
          },
          { returning: ["*"] },
        );
        const post = await sql.from(PostWithBigint).insert(
          {
            title: "Test Post",
            content: "Test Content",
            userId: userWithBigint.id,
          },
          { returning: ["*"] },
        );
        expect(post).toHaveProperty("id");
        await sql.rollbackGlobalTransaction();
      },
    );
  });

  test("[mariadb] should create an on a custom connection", async () => {
    await SqlDataSource.useConnection(
      {
        type: "mariadb",
        host: "localhost",
        username: "root",
        password: "root",
        database: "test",
        port: 3306,
      },
      async (sql) => {
        expect(sql.isConnected).toBe(true);
        expect(sql.getDbType()).toBe("mariadb");
        await sql.startGlobalTransaction();
        const userWithBigint = await sql.from(UserWithBigint).insert(
          {
            ...UserFactory.getCommonUserData(),
          },
          { returning: ["*"] },
        );
        const post = await sql.from(PostWithBigint).insert(
          {
            title: "Test Post",
            content: "Test Content",
            userId: userWithBigint.id,
          },
          { returning: ["*"] },
        );
        expect(post).toHaveProperty("id");
        await sql.rollbackGlobalTransaction();
      },
    );
  });

  test("[sqlite] should create an on a custom connection", async () => {
    await SqlDataSource.useConnection(
      {
        type: "sqlite",
        database: "sqlite.db",
      },
      async (sql) => {
        expect(sql.isConnected).toBe(true);
        expect(sql.getDbType()).toBe("sqlite");
        await sql.startGlobalTransaction();
        const userWithBigint = await sql.from(UserWithBigint).insert(
          {
            ...UserFactory.getCommonUserData(),
          },
          { returning: ["*"] },
        );
        const post = await sql.from(PostWithBigint).insert(
          {
            title: "Test Post",
            content: "Test Content",
            userId: userWithBigint.id,
          },
          { returning: ["*"] },
        );
        expect(post).toHaveProperty("id");
        await sql.rollbackGlobalTransaction();
      },
    );
  });
});
