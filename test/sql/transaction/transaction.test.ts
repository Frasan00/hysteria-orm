import { env } from "../../../src/env/env";
import { HysteriaError } from "../../../src/errors/hysteria_error";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserWithoutPk } from "../test_models/without_pk/user_without_pk";

beforeAll(async () => {
  await SqlDataSource.connect();
});

afterAll(async () => {
  await SqlDataSource.disconnect();
});

beforeEach(async () => {
  const users = await UserWithoutPk.query().many();
  expect(users.length).toBe(0);
  await UserWithoutPk.query().delete();
});

afterEach(async () => {
  await UserWithoutPk.query().delete();
  const users = await UserWithoutPk.query().many();
  expect(users.length).toBe(0);
});

describe("Use Transaction", () => {
  test("Should handle transaction correctly using useTransaction", async () => {
    await SqlDataSource.useTransaction(async (trx) => {
      await UserWithoutPk.insert(
        { ...UserFactory.getCommonUserData() },
        { trx },
      );
    });

    const users = await UserWithoutPk.query().many();
    expect(users.length).toBe(1);
  });

  test("Should rollback transaction when error occurs in useTransaction", async () => {
    try {
      await SqlDataSource.useTransaction(async (trx) => {
        await UserWithoutPk.insert(
          { ...UserFactory.getCommonUserData() },
          { trx },
        );
        throw new Error("Test error");
      });
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.message).toBe("Test error");
      }
    }

    const users = await UserWithoutPk.query().many();
    expect(users.length).toBe(0);
  });

  test("Should handle transaction with custom isolation level", async () => {
    await SqlDataSource.useTransaction(
      async (trx) => {
        await UserWithoutPk.insert(
          { ...UserFactory.getCommonUserData() },
          { trx },
        );
      },
      { isolationLevel: "SERIALIZABLE" },
    );

    const users = await UserWithoutPk.query().many();
    expect(users.length).toBe(1);
  });

  test("Should handle multiple operations in a single transaction", async () => {
    await SqlDataSource.useTransaction(async (trx) => {
      const user1 = await UserWithoutPk.insert(
        { ...UserFactory.getCommonUserData() },
        { trx },
      );

      const user2 = await UserWithoutPk.insert(
        { ...UserFactory.getCommonUserData() },
        { trx },
      );

      expect(user1).toBeDefined();
      expect(user2).toBeDefined();
      expect(user1.email).not.toBe(user2.email);
    });

    const users = await UserWithoutPk.query().many();
    expect(users.length).toBe(2);
  });
});

describe(`[${env.DB_TYPE}] Transaction`, () => {
  // Skip nested transactions test for SQLite since it's not supported
  const testNested = env.DB_TYPE === "sqlite" ? test.skip : test;
  testNested(
    "[Nested] Should handle nested transactions correctly",
    async () => {
      const outerTrx = await SqlDataSource.startTransaction();
      const user1 = await UserWithoutPk.insert(
        { ...UserFactory.getCommonUserData() },
        { trx: outerTrx },
      );

      const innerTrx = await SqlDataSource.startTransaction();
      await UserWithoutPk.insert(
        { ...UserFactory.getCommonUserData() },
        { trx: innerTrx },
      );

      await innerTrx.rollback();
      await outerTrx.commit();

      const retrievedUsers = await UserWithoutPk.query().many();
      expect(retrievedUsers.length).toBe(1);
      expect(retrievedUsers[0].email).toBe(user1.email);
    },
  );

  // Skip concurrent transactions test for SQLite since it's not supported
  const testConcurrent = env.DB_TYPE === "sqlite" ? test.skip : test;
  testConcurrent(
    "[Concurrent] Should handle concurrent transactions correctly",
    async () => {
      const trx1 = await SqlDataSource.startTransaction();
      const trx2 = await SqlDataSource.startTransaction();

      await UserWithoutPk.insert(
        { ...UserFactory.getCommonUserData() },
        { trx: trx1 },
      );

      await UserWithoutPk.insert(
        { ...UserFactory.getCommonUserData() },
        { trx: trx2 },
      );

      await trx1.commit();
      await trx2.commit();

      const retrievedUsers = await UserWithoutPk.query().many();
      expect(retrievedUsers.length).toBe(2);
    },
  );

  if (env.DB_TYPE === "sqlite") {
    test("[SQLite] Should handle single transaction correctly", async () => {
      const trx = await SqlDataSource.startTransaction();
      const user = await UserWithoutPk.insert(
        { ...UserFactory.getCommonUserData() },
        { trx },
      );

      await trx.commit();
      const retrievedUsers = await UserWithoutPk.query().many();
      expect(retrievedUsers.length).toBe(1);
      expect(retrievedUsers[0].email).toBe(user.email);
    });
  }

  test("[Commit] Simple transaction passing transaction to the Model methods", async () => {
    const trx = await SqlDataSource.startTransaction();
    const user = await UserWithoutPk.insert(
      {
        ...UserFactory.getCommonUserData(),
      },
      { trx },
    );

    await trx.commit({ throwErrorOnInactiveTransaction: true });
    const retrievedUsers = await UserWithoutPk.query().many();
    expect(retrievedUsers.length).toBe(1);
    expect(retrievedUsers[0]).toBeDefined();
    expect(retrievedUsers[0].email).toBe(user.email);
  });

  test("[Commit] Test global transaction", async () => {
    await SqlDataSource.startGlobalTransaction();
    const user = await UserWithoutPk.insert({
      ...UserFactory.getCommonUserData(),
    });

    await SqlDataSource.commitGlobalTransaction();

    const retrievedUsers = await UserWithoutPk.query().many();
    expect(retrievedUsers.length).toBe(1);
    expect(retrievedUsers[0]).toBeDefined();
    expect(retrievedUsers[0].email).toBe(user.email);
  });

  test("[Commit] Test global transaction with transaction with custom isolation level", async () => {
    const trx = await SqlDataSource.startTransaction({
      isolationLevel: "SERIALIZABLE",
    });

    const user = await UserWithoutPk.insert(
      {
        ...UserFactory.getCommonUserData(),
      },
      { trx },
    );

    await trx.commit({ throwErrorOnInactiveTransaction: true });
    const retrievedUsers = await UserWithoutPk.query().many();
    expect(retrievedUsers.length).toBe(1);
    expect(retrievedUsers[0]).toBeDefined();
    expect(retrievedUsers[0].email).toBe(user.email);
  });

  test("[Rollback] Simple transaction passing transaction to the Model methods", async () => {
    const trx = await SqlDataSource.startTransaction();
    const user = await UserWithoutPk.insert(
      {
        ...UserFactory.getCommonUserData(),
      },
      { trx },
    );

    await trx.rollback({ throwErrorOnInactiveTransaction: true });
    const retrievedUsers = await UserWithoutPk.query().many();
    expect(retrievedUsers.length).toBe(0);
  });

  test("[Rollback] Test global transaction", async () => {
    await SqlDataSource.startGlobalTransaction();
    const user = await UserWithoutPk.insert({
      ...UserFactory.getCommonUserData(),
    });

    await SqlDataSource.rollbackGlobalTransaction();

    const retrievedUsers = await UserWithoutPk.query().many();
    expect(retrievedUsers.length).toBe(0);
  });

  test("Should throw error if transaction is not active and throwErrorOnInactiveTransaction is true", async () => {
    const trx = await SqlDataSource.startTransaction();
    await trx.rollback();
    expect(trx.isActive).toBe(false);
    expect(
      trx.rollback({ throwErrorOnInactiveTransaction: true }),
    ).rejects.toThrow(HysteriaError);
  });

  test("Should not throw error if transaction is not active and throwErrorOnInactiveTransaction is false", async () => {
    const trx = await SqlDataSource.startTransaction();
    await trx.rollback();
    expect(trx.isActive).toBe(false);
    expect(
      trx.rollback({ throwErrorOnInactiveTransaction: false }),
    ).resolves.not.toThrow(HysteriaError);
  });
});

describe(`[${env.DB_TYPE}] Raw transaction from transaction sql instance should work`, () => {
  test("Simple transaction", async () => {
    const trx = await SqlDataSource.startTransaction();
    await trx.sql.rawQuery("SELECT 1");
    await trx.commit();
  });

  test("Insert with commit via query builder", async () => {
    const trx = await SqlDataSource.startTransaction();
    await trx.sql.query(UserWithoutPk.table).insert({
      email: "test@test.com",
    });

    await trx.commit();

    const retrievedUsers = await UserWithoutPk.query().many();
    expect(retrievedUsers.length).toBe(1);
    expect(retrievedUsers[0].email).toBe("test@test.com");
  });

  test("Insert with rollback via query builder", async () => {
    const trx = await SqlDataSource.startTransaction();
    await trx.sql.query(UserWithoutPk.table).insert({
      email: "test@test.com",
    });

    // standard connection should not have this transaction data
    // We avoid mid transaction testing for cockroachdb since it's serializable MVCC may cause issues
    if (env.DB_TYPE !== "cockroachdb") {
      const usersFromStandardConnection = await UserWithoutPk.query().many();
      expect(usersFromStandardConnection.length).toBe(0);
    }

    await trx.rollback();

    const retrievedUsers = await UserWithoutPk.query().many();
    expect(retrievedUsers.length).toBe(0);
  });

  test("Insert many with commit via model manager", async () => {
    const trx = await SqlDataSource.startTransaction();
    const modelManager = trx.sql.getModelManager(UserWithoutPk);
    await modelManager.insertMany([
      { email: "test@test.com" },
      { email: "test2@test.com" },
    ]);

    // standard connection should not have this transaction data
    if (env.DB_TYPE !== "cockroachdb") {
      const usersFromStandardConnection = await UserWithoutPk.query().many();
      expect(usersFromStandardConnection.length).toBe(0);
    }

    await trx.commit();

    const retrievedUsers = await UserWithoutPk.query().many();
    expect(retrievedUsers.length).toBe(2);
    expect(retrievedUsers[0].email).toBe("test@test.com");
    expect(retrievedUsers[1].email).toBe("test2@test.com");
  });

  test("Insert many with rollback via model manager", async () => {
    const trx = await SqlDataSource.startTransaction();
    const modelManager = trx.sql.getModelManager(UserWithoutPk);
    await modelManager.insertMany([
      { email: "test@test.com" },
      { email: "test2@test.com" },
    ]);

    // standard connection should not have this transaction data
    if (env.DB_TYPE !== "cockroachdb") {
      const usersFromStandardConnection = await UserWithoutPk.query().many();
      expect(usersFromStandardConnection.length).toBe(0);
    }

    await trx.rollback();
  });

  test("Update with commit via query builder", async () => {
    const trx = await SqlDataSource.startTransaction();
    await trx.sql.query(UserWithoutPk.table).update({
      email: "test@test.com",
    });

    await trx.commit();
  });
});

describe(`[${env.DB_TYPE}] Nested transactions with savePoints`, () => {
  test("Simple transaction", async () => {
    const trx = await SqlDataSource.startTransaction();
    await trx.sql.rawQuery("SELECT 1");
    const nestedTrx = await trx.nestedTransaction();
    await nestedTrx.sql.rawQuery("SELECT 2");
    await nestedTrx.commit();
    await trx.commit();
  });

  test("Nested transaction with insert", async () => {
    const trx = await SqlDataSource.startTransaction();
    await trx.sql.rawQuery("SELECT 1");
    const nestedTrx = await trx.nestedTransaction();
    await nestedTrx.sql.query(UserWithoutPk.table).insert({
      email: "test@test.com",
    });

    const lookupQuery = await nestedTrx.sql
      .query(UserWithoutPk.table)
      .where("email", "test@test.com")
      .one();

    await nestedTrx.commit();
    await trx.commit();

    expect(lookupQuery).toBeDefined();
    expect(lookupQuery.email).toBe("test@test.com");
  });

  test("Multi-level nesting commit chain", async () => {
    const outer = await SqlDataSource.startTransaction();
    const lvl1 = await outer.nestedTransaction();
    const lvl2 = await lvl1.nestedTransaction();

    await lvl2.sql
      .query(UserWithoutPk.table)
      .insert({ email: "nest2@test.com" });

    await lvl2.commit();
    await lvl1.commit();

    // Before outer commit, data should not be visible from default connection (except cockroachdb caveat)
    if (env.DB_TYPE !== "cockroachdb") {
      const midUsers = await UserWithoutPk.query().many();
      expect(midUsers.length).toBe(0);
    }

    await outer.commit();

    const users = await UserWithoutPk.query().many();
    expect(users.length).toBe(1);
    expect(users[0].email).toBe("nest2@test.com");
  });

  test("Inner rollback, outer commit persists outer work only", async () => {
    const outer = await SqlDataSource.startTransaction();
    await outer.sql
      .query(UserWithoutPk.table)
      .insert({ email: "outer@test.com" });

    const inner = await outer.nestedTransaction();
    await inner.sql
      .query(UserWithoutPk.table)
      .insert({ email: "inner@test.com" });

    await inner.rollback(); // rollback savepoint

    // Inner changes should not be visible; outer still uncommitted
    if (env.DB_TYPE !== "cockroachdb") {
      const midUsers = await UserWithoutPk.query().many();
      expect(midUsers.length).toBe(0);
    }

    await outer.commit();

    const users = await UserWithoutPk.query().many();
    expect(users.length).toBe(1);
    expect(users[0].email).toBe("outer@test.com");
  });

  test("Nested rollback then continue outer", async () => {
    const outer = await SqlDataSource.startTransaction();
    const inner = await outer.nestedTransaction();
    await inner.sql
      .query(UserWithoutPk.table)
      .insert({ email: "inner-rollback@test.com" });
    await inner.rollback();

    // Continue working on outer
    await outer.sql
      .query(UserWithoutPk.table)
      .insert({ email: "outer-commit@test.com" });

    await outer.commit();

    const users = await UserWithoutPk.query().many();
    expect(users.length).toBe(1);
    expect(users[0].email).toBe("outer-commit@test.com");
  });

  test("Nested inactive error behavior on rollback/commit", async () => {
    const outer = await SqlDataSource.startTransaction();
    const inner = await outer.nestedTransaction();
    await inner.sql.rawQuery("SELECT 1");
    await inner.commit();

    // After commit, inner is inactive: rollback with throw flag should reject
    await expect(
      inner.rollback({ throwErrorOnInactiveTransaction: true }),
    ).rejects.toBeInstanceOf(HysteriaError);

    // And commit with throw flag should also reject
    await expect(
      inner.commit({ throwErrorOnInactiveTransaction: true }),
    ).rejects.toBeInstanceOf(HysteriaError);

    await outer.rollback();
  });
});
