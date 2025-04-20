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
