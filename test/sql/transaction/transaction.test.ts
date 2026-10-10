import { env } from "../../../src/env/env";
import { HysteriaError } from "../../../src/errors/hysteria_error";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import logger from "../../../src/utils/logger";
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

describe("Use Transaction", () => {
  test("Should handle transaction correctly using transaction", async () => {
    await sql.transaction(async (trx) => {
      await sql
        .from(UserWithoutPk)
        .insert({ ...UserFactory.getCommonUserData() }, { trx });
    });

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(1);
  });

  test("Should rollback transaction when error occurs in transaction", async () => {
    try {
      await sql.transaction(async (trx) => {
        await sql
          .from(UserWithoutPk)
          .insert({ ...UserFactory.getCommonUserData() }, { trx });
        throw new Error("Test error");
      });
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.message).toBe("Test error");
      }
    }

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(0);
  });

  test("Should handle transaction with custom isolation level", async () => {
    await sql.transaction(
      async (trx) => {
        await sql
          .from(UserWithoutPk)
          .insert({ ...UserFactory.getCommonUserData() }, { trx });
      },
      { isolationLevel: "SERIALIZABLE" },
    );

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(1);
  });

  test("Should handle multiple operations in a single transaction", async () => {
    await sql.transaction(async (trx) => {
      const user1 = await sql
        .from(UserWithoutPk)
        .insert(
          { ...UserFactory.getCommonUserData() },
          { trx, returning: ["*"] },
        );

      const user2 = await sql
        .from(UserWithoutPk)
        .insert(
          { ...UserFactory.getCommonUserData() },
          { trx, returning: ["*"] },
        );

      expect(user1).toBeDefined();
      expect(user2).toBeDefined();
      expect(user1.email).not.toBe(user2.email);
    });

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(2);
  });
});

describe(`[${env.DB_TYPE}] Transaction`, () => {
  // Skip on SQLite: the second independent transaction contends for the one shared connection.
  const testIndependent = env.DB_TYPE === "sqlite" ? test.skip : test;
  testIndependent(
    "[Independent] A manual transaction started while another is active opens its own connection",
    async () => {
      const outerTrx = await sql.transaction();
      const user1 = await sql
        .from(UserWithoutPk)
        .insert(
          { ...UserFactory.getCommonUserData() },
          { trx: outerTrx, returning: ["*"] as const },
        );

      const innerTrx = await sql.transaction();
      // A second top-level manual transaction is independent, not a savepoint on
      // the outer connection.
      expect(innerTrx.sql.sqlConnection).not.toBe(outerTrx.sql.sqlConnection);

      await sql
        .from(UserWithoutPk)
        .insert({ ...UserFactory.getCommonUserData() }, { trx: innerTrx });

      await innerTrx.rollback();
      await outerTrx.commit();

      const retrievedUsers = await sql.from(UserWithoutPk).many();
      expect(retrievedUsers.length).toBe(1);
      expect(retrievedUsers[0].email).toBe(user1.email);
    },
  );

  // Skip concurrent transactions test for SQLite since it's not supported
  const testConcurrent = env.DB_TYPE === "sqlite" ? test.skip : test;
  testConcurrent(
    "[Concurrent] Should handle concurrent transactions correctly",
    async () => {
      const trx1 = await sql.transaction();
      const trx2 = await sql.transaction();

      await sql
        .from(UserWithoutPk)
        .insert({ ...UserFactory.getCommonUserData() }, { trx: trx1 });

      await sql
        .from(UserWithoutPk)
        .insert({ ...UserFactory.getCommonUserData() }, { trx: trx2 });

      await trx1.commit();
      await trx2.commit();

      const retrievedUsers = await sql.from(UserWithoutPk).many();
      expect(retrievedUsers.length).toBe(2);
    },
  );

  if (env.DB_TYPE === "sqlite") {
    test("[SQLite] Should handle single transaction correctly", async () => {
      const trx = await sql.transaction();
      const user = await sql
        .from(UserWithoutPk)
        .insert(
          { ...UserFactory.getCommonUserData() },
          { trx, returning: ["*"] },
        );

      await trx.commit();
      const retrievedUsers = await sql.from(UserWithoutPk).many();
      expect(retrievedUsers.length).toBe(1);
      expect(retrievedUsers[0].email).toBe(user.email);
    });
  }

  test("[Commit] Simple transaction passing transaction to the Model methods", async () => {
    const trx = await sql.transaction();
    const user = await sql.from(UserWithoutPk).insert(
      {
        ...UserFactory.getCommonUserData(),
      },
      { trx, returning: ["*"] },
    );

    await trx.commit({ throwErrorOnInactiveTransaction: true });
    const retrievedUsers = await sql.from(UserWithoutPk).many();
    expect(retrievedUsers.length).toBe(1);
    expect(retrievedUsers[0]).toBeDefined();
    expect(retrievedUsers[0].email).toBe(user.email);
  });

  test("[Commit] Test global transaction", async () => {
    await sql.startGlobalTransaction();
    const user = await sql.from(UserWithoutPk).insert(
      {
        ...UserFactory.getCommonUserData(),
      },
      { returning: ["*"] },
    );

    await sql.commitGlobalTransaction();

    const retrievedUsers = await sql.from(UserWithoutPk).many();
    expect(retrievedUsers.length).toBe(1);
    expect(retrievedUsers[0]).toBeDefined();
    expect(retrievedUsers[0].email).toBe(user.email);
  });

  test("[Commit] Test global transaction with transaction with custom isolation level", async () => {
    const trx = await sql.transaction({
      isolationLevel: "SERIALIZABLE",
    });

    const user = await sql.from(UserWithoutPk).insert(
      {
        ...UserFactory.getCommonUserData(),
      },
      { trx, returning: ["*"] },
    );

    await trx.commit({ throwErrorOnInactiveTransaction: true });
    const retrievedUsers = await sql.from(UserWithoutPk).many();
    expect(retrievedUsers.length).toBe(1);
    expect(retrievedUsers[0]).toBeDefined();
    expect(retrievedUsers[0].email).toBe(user.email);
  });

  test("[Rollback] Simple transaction passing transaction to the Model methods", async () => {
    const trx = await sql.transaction();
    await sql.from(UserWithoutPk).insert(
      {
        ...UserFactory.getCommonUserData(),
      },
      { trx },
    );

    await trx.rollback({ throwErrorOnInactiveTransaction: true });
    const retrievedUsers = await sql.from(UserWithoutPk).many();
    expect(retrievedUsers.length).toBe(0);
  });

  test("[Rollback] Test global transaction", async () => {
    await sql.startGlobalTransaction();
    await sql.from(UserWithoutPk).insert({
      ...UserFactory.getCommonUserData(),
    });

    await sql.rollbackGlobalTransaction();

    const retrievedUsers = await sql.from(UserWithoutPk).many();
    expect(retrievedUsers.length).toBe(0);
  });

  test("Should throw error if transaction is not active and throwErrorOnInactiveTransaction is true", async () => {
    const trx = await sql.transaction();
    await trx.rollback();
    expect(trx.isActive).toBe(false);
    expect(
      trx.rollback({ throwErrorOnInactiveTransaction: true }),
    ).rejects.toThrow(HysteriaError);
  });

  test("Should not throw error if transaction is not active and throwErrorOnInactiveTransaction is false", async () => {
    const trx = await sql.transaction();
    await trx.rollback();
    expect(trx.isActive).toBe(false);
    expect(
      trx.rollback({ throwErrorOnInactiveTransaction: false }),
    ).resolves.not.toThrow(HysteriaError);
  });
});

describe(`[${env.DB_TYPE}] Raw transaction from transaction sql instance should work`, () => {
  test("Simple transaction", async () => {
    const trx = await sql.transaction();
    await trx.sql.rawQuery("SELECT 1");
    await trx.commit();
  });

  test("Insert with commit via query builder", async () => {
    const trx = await sql.transaction();
    await trx.sql.from(UserWithoutPk.table).insert({
      email: "test@test.com",
    });

    await trx.commit();

    const retrievedUsers = await sql.from(UserWithoutPk).many();
    expect(retrievedUsers.length).toBe(1);
    expect(retrievedUsers[0].email).toBe("test@test.com");
  });

  test("Insert with rollback via query builder", async () => {
    const trx = await sql.transaction();
    await trx.sql.from(UserWithoutPk.table).insert({
      email: "test@test.com",
    });

    // standard connection should not have this transaction data
    // We avoid mid transaction testing for cockroachdb since it's serializable MVCC may cause issues
    // MSSQL also blocks reads on tables with uncommitted writes (lock contention)
    if (env.DB_TYPE !== "cockroachdb" && env.DB_TYPE !== "mssql") {
      const usersFromStandardConnection = await sql.from(UserWithoutPk).many();
      expect(usersFromStandardConnection.length).toBe(0);
    }

    await trx.rollback();

    const retrievedUsers = await sql.from(UserWithoutPk).many();
    expect(retrievedUsers.length).toBe(0);
  });

  test("Insert many with commit via model manager", async () => {
    const trx = await sql.transaction();
    const modelManager = trx.sql.getModelManager(UserWithoutPk);
    await modelManager.insertMany([
      { email: "test@test.com" },
      { email: "test2@test.com" },
    ]);

    // standard connection should not have this transaction data
    // MSSQL blocks reads on tables with uncommitted writes (lock contention)
    if (env.DB_TYPE !== "cockroachdb" && env.DB_TYPE !== "mssql") {
      const usersFromStandardConnection = await sql.from(UserWithoutPk).many();
      expect(usersFromStandardConnection.length).toBe(0);
    }

    await trx.commit();

    const retrievedUsers = await sql.from(UserWithoutPk).many();
    expect(retrievedUsers.length).toBe(2);
    expect(retrievedUsers).toContainEqual(
      expect.objectContaining({ email: "test@test.com" }),
    );
    expect(retrievedUsers).toContainEqual(
      expect.objectContaining({ email: "test2@test.com" }),
    );
  });

  test("Insert many with rollback via model manager", async () => {
    const trx = await sql.transaction();
    const modelManager = trx.sql.getModelManager(UserWithoutPk);
    await modelManager.insertMany([
      { email: "test@test.com" },
      { email: "test2@test.com" },
    ]);

    // standard connection should not have this transaction data
    // MSSQL blocks reads on tables with uncommitted writes (lock contention)
    if (env.DB_TYPE !== "cockroachdb" && env.DB_TYPE !== "mssql") {
      const usersFromStandardConnection = await sql.from(UserWithoutPk).many();
      expect(usersFromStandardConnection.length).toBe(0);
    }

    await trx.rollback();
  });

  test("Update with commit via query builder", async () => {
    const trx = await sql.transaction();
    await trx.sql.from(UserWithoutPk.table).update({
      email: "test@test.com",
    });

    await trx.commit();
  });
});

describe(`[${env.DB_TYPE}] Transaction Alias - static use`, () => {
  // Skip on SQLite: the second independent transaction contends for the one shared connection.
  const testIndependent = env.DB_TYPE === "sqlite" ? test.skip : test;
  const testConcurrent = env.DB_TYPE === "sqlite" ? test.skip : test;

  testIndependent(
    "[Independent][Alias-Static] A manual transaction started while another is active opens its own connection",
    async () => {
      const outerTrx = await sql.transaction();
      const user1 = await sql
        .from(UserWithoutPk)
        .insert(
          { ...UserFactory.getCommonUserData() },
          { trx: outerTrx, returning: ["*"] as const },
        );

      const innerTrx = await sql.transaction();
      // A second top-level manual transaction is independent, not a savepoint on
      // the outer connection.
      expect(innerTrx.sql.sqlConnection).not.toBe(outerTrx.sql.sqlConnection);

      await sql
        .from(UserWithoutPk)
        .insert({ ...UserFactory.getCommonUserData() }, { trx: innerTrx });

      await innerTrx.rollback();
      await outerTrx.commit();

      const retrievedUsers = await sql.from(UserWithoutPk).many();
      expect(retrievedUsers.length).toBe(1);
      expect(retrievedUsers[0].email).toBe(user1.email);
    },
  );

  testConcurrent(
    "[Concurrent][Alias-Static] Should handle concurrent transactions correctly",
    async () => {
      const trx1 = await sql.transaction();
      const trx2 = await sql.transaction();

      await sql
        .from(UserWithoutPk)
        .insert({ ...UserFactory.getCommonUserData() }, { trx: trx1 });

      await sql
        .from(UserWithoutPk)
        .insert({ ...UserFactory.getCommonUserData() }, { trx: trx2 });

      await trx1.commit();
      await trx2.commit();

      const retrievedUsers = await sql.from(UserWithoutPk).many();
      expect(retrievedUsers.length).toBe(2);
    },
  );

  test("[Commit][Alias-Static] Simple transaction passing trx to Model methods", async () => {
    const trx = await sql.transaction();
    const user = await sql
      .from(UserWithoutPk)
      .insert(
        { ...UserFactory.getCommonUserData() },
        { trx, returning: ["*"] },
      );
    await trx.commit({ throwErrorOnInactiveTransaction: true });
    const retrievedUsers = await sql.from(UserWithoutPk).many();
    expect(retrievedUsers.length).toBe(1);
    expect(retrievedUsers[0].email).toBe(user.email);
  });

  test("[Rollback][Alias-Static] Simple transaction passing trx to Model methods", async () => {
    const trx = await sql.transaction();
    await sql
      .from(UserWithoutPk)
      .insert({ ...UserFactory.getCommonUserData() }, { trx });
    await trx.rollback({ throwErrorOnInactiveTransaction: true });
    const retrievedUsers = await sql.from(UserWithoutPk).many();
    expect(retrievedUsers.length).toBe(0);
  });

  test("[Raw][Alias-Static] Simple transaction", async () => {
    const trx = await sql.transaction();
    await trx.sql.rawQuery("SELECT 1");
    await trx.commit();
  });
});

describe(`[${env.DB_TYPE}] Transaction Alias - instance use`, () => {
  // Skip on SQLite: the second independent transaction contends for the one shared connection.
  const testIndependent = env.DB_TYPE === "sqlite" ? test.skip : test;
  const testConcurrent = env.DB_TYPE === "sqlite" ? test.skip : test;

  testIndependent(
    "[Independent][Alias-Instance] A manual transaction started while another is active opens its own connection",
    async () => {
      const outerTrx = await sql.transaction();
      const user1 = await sql
        .from(UserWithoutPk)
        .insert(
          { ...UserFactory.getCommonUserData() },
          { trx: outerTrx, returning: ["*"] as const },
        );

      const innerTrx = await sql.transaction();
      // A second top-level manual transaction is independent, not a savepoint on
      // the outer connection.
      expect(innerTrx.sql.sqlConnection).not.toBe(outerTrx.sql.sqlConnection);

      await sql
        .from(UserWithoutPk)
        .insert({ ...UserFactory.getCommonUserData() }, { trx: innerTrx });

      await innerTrx.rollback();
      await outerTrx.commit();

      const retrievedUsers = await sql.from(UserWithoutPk).many();
      expect(retrievedUsers.length).toBe(1);
      expect(retrievedUsers[0].email).toBe(user1.email);
    },
  );

  testConcurrent(
    "[Concurrent][Alias-Instance] Should handle concurrent transactions correctly",
    async () => {
      const trx1 = await sql.transaction();
      const trx2 = await sql.transaction();

      await sql
        .from(UserWithoutPk)
        .insert({ ...UserFactory.getCommonUserData() }, { trx: trx1 });

      await sql
        .from(UserWithoutPk)
        .insert({ ...UserFactory.getCommonUserData() }, { trx: trx2 });

      await trx1.commit();
      await trx2.commit();

      const retrievedUsers = await sql.from(UserWithoutPk).many();
      expect(retrievedUsers.length).toBe(2);
    },
  );

  test("[Commit][Alias-Instance] Simple transaction passing trx to Model methods", async () => {
    const trx = await sql.transaction();
    const user = await sql
      .from(UserWithoutPk)
      .insert(
        { ...UserFactory.getCommonUserData() },
        { trx, returning: ["*"] },
      );
    await trx.commit({ throwErrorOnInactiveTransaction: true });
    const retrievedUsers = await sql.from(UserWithoutPk).many();
    expect(retrievedUsers.length).toBe(1);
    expect(retrievedUsers[0].email).toBe(user.email);
  });

  test("[Rollback][Alias-Instance] Simple transaction passing trx to Model methods", async () => {
    const trx = await sql.transaction();
    await sql
      .from(UserWithoutPk)
      .insert({ ...UserFactory.getCommonUserData() }, { trx });
    await trx.rollback({ throwErrorOnInactiveTransaction: true });
    const retrievedUsers = await sql.from(UserWithoutPk).many();
    expect(retrievedUsers.length).toBe(0);
  });

  test("[Raw][Alias-Instance] Simple transaction", async () => {
    const trx = await sql.transaction();
    await trx.sql.rawQuery("SELECT 1");
    await trx.commit();
  });

  test("[Callback][Alias-Instance] Should handle instance alias transaction with callback", async () => {
    await sql.transaction(async (trx) => {
      await sql
        .from(UserWithoutPk)
        .insert({ ...UserFactory.getCommonUserData() }, { trx });
    });
    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBeGreaterThan(0);
  });
});

describe(`[${env.DB_TYPE}] Nested transactions with savePoints`, () => {
  test("Simple transaction", async () => {
    const trx = await sql.transaction();
    await trx.sql.rawQuery("SELECT 1");
    const nestedTrx = await trx.nestedTransaction();
    await nestedTrx.sql.rawQuery("SELECT 2");
    await nestedTrx.commit();
    await trx.commit();
  });

  test("Nested transaction with callback", async () => {
    const trx = await sql.transaction();
    await trx.sql.rawQuery("SELECT 1");
    await trx.nestedTransaction(async (trx) => {
      await trx.sql.from(UserWithoutPk.table).insert({
        email: "test@test.com",
      });
    });

    await trx.commit();

    const retrievedUsers = await sql.from(UserWithoutPk).many();
    expect(retrievedUsers.length).toBe(1);
    expect(retrievedUsers[0].email).toBe("test@test.com");
  });

  test("Nested transaction with insert", async () => {
    const trx = await sql.transaction();
    await trx.sql.rawQuery("SELECT 1");
    const nestedTrx = await trx.nestedTransaction();
    await nestedTrx.sql.from(UserWithoutPk.table).insert({
      email: "test@test.com",
    });

    const lookupQuery = await nestedTrx.sql
      .from(UserWithoutPk.table)
      .where("email", "test@test.com")
      .one();

    await nestedTrx.commit();
    await trx.commit();

    expect(lookupQuery).toBeDefined();
    expect(lookupQuery?.email).toBe("test@test.com");
  });

  test("Multi-level nesting commit chain", async () => {
    const outer = await sql.transaction();
    const lvl1 = await outer.nestedTransaction();
    const lvl2 = await lvl1.nestedTransaction();

    await lvl2.sql
      .from(UserWithoutPk.table)
      .insert({ email: "nest2@test.com" });

    await lvl2.commit();
    await lvl1.commit();

    // Before outer commit, data should not be visible from default connection (except cockroachdb caveat)
    // MSSQL also blocks reads on tables with uncommitted writes (lock contention)
    if (env.DB_TYPE !== "cockroachdb" && env.DB_TYPE !== "mssql") {
      const midUsers = await sql.from(UserWithoutPk).many();
      expect(midUsers.length).toBe(0);
    }

    await outer.commit();

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(1);
    expect(users[0].email).toBe("nest2@test.com");
  });

  test("Inner rollback, outer commit persists outer work only", async () => {
    const outer = await sql.transaction();
    await outer.sql
      .from(UserWithoutPk.table)
      .insert({ email: "outer@test.com" });

    const inner = await outer.nestedTransaction();
    await inner.sql
      .from(UserWithoutPk.table)
      .insert({ email: "inner@test.com" });

    await inner.rollback(); // rollback savepoint

    // Inner changes should not be visible; outer still uncommitted
    // MSSQL also blocks reads on tables with uncommitted writes (lock contention)
    if (env.DB_TYPE !== "cockroachdb" && env.DB_TYPE !== "mssql") {
      const midUsers = await sql.from(UserWithoutPk).many();
      expect(midUsers.length).toBe(0);
    }

    await outer.commit();

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(1);
    expect(users[0].email).toBe("outer@test.com");
  });

  test("Nested rollback then continue outer", async () => {
    const outer = await sql.transaction();
    const inner = await outer.nestedTransaction();
    await inner.sql
      .from(UserWithoutPk.table)
      .insert({ email: "inner-rollback@test.com" });
    await inner.rollback();

    // Continue working on outer
    await outer.sql
      .from(UserWithoutPk.table)
      .insert({ email: "outer-commit@test.com" });

    await outer.commit();

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(1);
    expect(users[0].email).toBe("outer-commit@test.com");
  });

  test("Nested inactive error behavior on rollback/commit", async () => {
    const outer = await sql.transaction();
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

  test("Nested transaction with callback", async () => {
    const trx = await sql.transaction();
    await trx.sql.rawQuery("SELECT 1");
    await trx.nestedTransaction(async (trx) => {
      await trx.nestedTransaction(async (trx) => {
        await trx.sql.from(UserWithoutPk.table).insert({
          email: "test@test.com",
        });

        await trx.nestedTransaction(async (trx) => {
          await trx.sql.from(UserWithoutPk.table).insert({
            email: "test2@test.com",
          });

          await trx.nestedTransaction(async (trx) => {
            await trx.sql.from(UserWithoutPk.table).insert({
              email: "test3@test.com",
            });
          });
        });
      });
    });

    await trx.commit();

    const users = await sql.from(UserWithoutPk).many();
    expect(users.length).toBe(3);
    expect(users[0].email).toBe("test@test.com");
    expect(users[1].email).toBe("test2@test.com");
    expect(users[2].email).toBe("test3@test.com");
  });
});

describe(`[${env.DB_TYPE}] Nested isolation level`, () => {
  // A nested transaction is a savepoint on the outer connection, where the level
  // cannot change, so a request for one is reported rather than silently dropped.
  const isolationWarnings = (spy: jest.SpyInstance): string[] =>
    spy.mock.calls
      .map((call) => String(call[0]))
      .filter((message) => message.includes("ignoring isolation level"));

  test("warns when a nested call requests an isolation level", async () => {
    const warnSpy = jest.spyOn(logger, "warn").mockImplementation(() => {});

    try {
      await sql.transaction(async () => {
        await sql.transaction(async () => {}, {
          isolationLevel: "SERIALIZABLE",
        });
      });

      const warnings = isolationWarnings(warnSpy);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("SERIALIZABLE");
    } finally {
      warnSpy.mockRestore();
    }
  });

  test("stays quiet when the nested call asks for no level", async () => {
    const warnSpy = jest.spyOn(logger, "warn").mockImplementation(() => {});

    try {
      await sql.transaction(async () => {
        await sql.transaction(async () => {});
      });

      expect(isolationWarnings(warnSpy)).toHaveLength(0);
    } finally {
      warnSpy.mockRestore();
    }
  });

  test("stays quiet at the top level, where the level is honoured", async () => {
    const warnSpy = jest.spyOn(logger, "warn").mockImplementation(() => {});

    try {
      await sql.transaction(async () => {}, {
        isolationLevel: "SERIALIZABLE",
      });

      expect(isolationWarnings(warnSpy)).toHaveLength(0);
    } finally {
      warnSpy.mockRestore();
    }
  });
});
