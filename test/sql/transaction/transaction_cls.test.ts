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

describe(`[${env.DB_TYPE}] CLS Transaction Auto-Propagation`, () => {
  const testNested = env.DB_TYPE === "sqlite" ? test.skip : test;
  const testConcurrent =
    env.DB_TYPE === "sqlite" ||
    env.DB_TYPE === "cockroachdb" ||
    env.DB_TYPE === "mssql"
      ? test.skip
      : test;
  const testSkipSQLite = env.DB_TYPE === "sqlite" ? test.skip : test;

  test("Should auto-propagate transaction in callback without explicit trx", async () => {
    await sql.transaction(async () => {
      await sql
        .from(UserWithoutPk)
        .insert({ ...UserFactory.getCommonUserData() });
    });

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(1);
  });

  test("Should auto-rollback when callback throws", async () => {
    try {
      await sql.transaction(async () => {
        await sql
          .from(UserWithoutPk)
          .insert({ ...UserFactory.getCommonUserData() });
        throw new Error("CLS rollback test");
      });
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.message).toBe("CLS rollback test");
      }
    }

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(0);
  });

  test("Should auto-propagate for rawQuery inside callback", async () => {
    await sql.transaction(async () => {
      await sql.rawQuery(
        `INSERT INTO ${UserWithoutPk.table} (email, name, age) VALUES (?, ?, ?)`,
        ["raw@test.com", "Raw User", 30],
      );
    });

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(1);
    expect(users[0].email).toBe("raw@test.com");
  });

  test("Should auto-propagate for getModelManager inside callback", async () => {
    await sql.transaction(async () => {
      const manager = sql.getModelManager(UserWithoutPk);
      await manager.insertMany([
        { email: "mm1@test.com", name: "MM1", age: 20 },
        { email: "mm2@test.com", name: "MM2", age: 21 },
      ]);
    });

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(2);
  });

  test("Should auto-propagate for read operations inside callback", async () => {
    await sql
      .from(UserWithoutPk)
      .insert({ ...UserFactory.getCommonUserData() });

    await sql.transaction(async () => {
      const users = await sql.from(UserWithoutPk).many();
      expect(users.length).toBe(1);
    });
  });

  testSkipSQLite(
    "Explicit trx parameter should take precedence over ALS",
    async () => {
      const manualTrx = await sql.transaction();
      await sql
        .from(UserWithoutPk)
        .insert({ ...UserFactory.getCommonUserData() }, { trx: manualTrx });

      await sql.transaction(async () => {
        await sql.from(UserWithoutPk).insert({
          ...UserFactory.getCommonUserData(),
          email: "als@test.com",
        });
      });

      await manualTrx.commit();

      const users = await sql.from(UserWithoutPk).many();
      expect(users.length).toBe(2);
    },
  );

  testNested(
    "Should handle nested callback transactions as savepoints",
    async () => {
      await sql.transaction(async () => {
        await sql.from(UserWithoutPk).insert({
          ...UserFactory.getCommonUserData(),
          email: "outer@test.com",
        });

        await sql.transaction(async () => {
          await sql.from(UserWithoutPk).insert({
            ...UserFactory.getCommonUserData(),
            email: "inner@test.com",
          });
        });
      });

      const users = await sql.from(UserWithoutPk).many();
      expect(users.length).toBe(2);
    },
  );

  testSkipSQLite(
    "Should not auto-propagate when clsEnabled is false",
    async () => {
      const sqlNoCls = new SqlDataSource({
        ...(sql.inputDetails as any),
        clsEnabled: false,
      } as any);
      await sqlNoCls.connect();

      try {
        await sqlNoCls.transaction(async () => {
          await sqlNoCls
            .from(UserWithoutPk)
            .insert({ ...UserFactory.getCommonUserData() });
          throw new Error("Should rollback");
        });
      } catch (error) {
        // expected
      }

      // Because clsEnabled is false, the query ran on the pool (not the transaction).
      // The transaction rolled back, but pool data persists.
      const users = await sqlNoCls.from(UserWithoutPk).many();
      expect(users.length).toBe(1);

      await sqlNoCls.from(UserWithoutPk).delete();
      await sqlNoCls.disconnect();
    },
  );

  testConcurrent(
    "Should isolate concurrent callback transactions",
    async () => {
      const p1 = sql.transaction(async () => {
        await sql.from(UserWithoutPk).insert({
          ...UserFactory.getCommonUserData(),
          email: "concurrent1@test.com",
        });
        const users = await sql.from(UserWithoutPk).many();
        return users.length;
      });

      const p2 = sql.transaction(async () => {
        await sql.from(UserWithoutPk).insert({
          ...UserFactory.getCommonUserData(),
          email: "concurrent2@test.com",
        });
        const users = await sql.from(UserWithoutPk).many();
        return users.length;
      });

      const [count1, count2] = await Promise.all([p1, p2]);
      expect(count1).toBe(1);
      expect(count2).toBe(1);

      const allUsers = await sql.from(UserWithoutPk).many();
      expect(allUsers.length).toBe(2);
    },
  );

  test("Should not leak ALS transaction outside callback", async () => {
    await sql.transaction(async () => {
      await sql.from(UserWithoutPk).insert({
        ...UserFactory.getCommonUserData(),
        email: "inside@test.com",
      });
    });

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(1);
    expect(users[0].email).toBe("inside@test.com");
  });

  test("Should propagate through promise chains", async () => {
    await sql.transaction(async () => {
      await Promise.resolve().then(async () => {
        await sql
          .from(UserWithoutPk)
          .insert({ ...UserFactory.getCommonUserData() });
      });
    });

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(1);
  });

  testNested(
    "Should support manual transaction inside ALS callback",
    async () => {
      await sql.transaction(async () => {
        await sql.from(UserWithoutPk).insert({
          ...UserFactory.getCommonUserData(),
          email: "als-outer@test.com",
        });

        const nestedTrx = await sql.transaction();
        await sql
          .from(UserWithoutPk)
          .insert(
            { ...UserFactory.getCommonUserData(), email: "als-inner@test.com" },
            { trx: nestedTrx },
          );
        await nestedTrx.commit();
      });

      const users = await sql.from(UserWithoutPk).many();
      expect(users.length).toBe(2);
    },
  );
});
