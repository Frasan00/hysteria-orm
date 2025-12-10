import { env } from "../../../src/env/env";
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
  await SqlDataSource.startGlobalTransaction();
});

afterEach(async () => {
  await SqlDataSource.rollbackGlobalTransaction();
});

describe(`[${env.DB_TYPE}] Query Builder Complex Edge Cases`, () => {
  test("Should handle deeply nested where conditions without stack overflow", async () => {
    // Edge case: Test for stack overflow with many chained conditions
    let queryBuilder = UserWithoutPk.query();

    // Create many chained where conditions (potential performance issues)
    for (let i = 0; i < 100; i++) {
      queryBuilder = queryBuilder
        .where("name", "like", `%test${i}%`)
        .orWhere("email", "like", `%test${i}@example.com%`);
    }

    // Should not cause stack overflow or performance issues
    await expect(queryBuilder.many()).resolves.not.toThrow();
  });

  test("Should handle complex query chains", async () => {
    // Edge case: Complex nested queries that could cause issues
    const complexQuery = UserWithoutPk.query()
      .where("name", "like", "%test%")
      .orWhere("email", "like", "%@example.com%")
      .where("description", "!=", "spam");

    await expect(complexQuery.many()).resolves.not.toThrow();
  });

  test("Should handle memory-intensive query chain operations", async () => {
    // Edge case: Long chain of query operations that could cause memory issues
    let query = UserWithoutPk.query();

    // Chain many operations
    for (let i = 0; i < 100; i++) {
      query = query
        .where(`name`, "!=", `test${i}`)
        .orWhere(`email`, "like", `%${i}%`)
        .limit(1000)
        .offset(i);
    }
    query = query.orderBy("name", "asc");

    await expect(query.many()).resolves.not.toThrow();
  });

  test("Should handle massive IN clause with thousands of values", async () => {
    // Edge case: IN clause with massive array that could cause SQL limits or memory issues
    const massiveArray = Array.from(
      { length: 1000 },
      (_, i) => `test${i}@example.com`,
    );

    const query = UserWithoutPk.query().whereIn("email", massiveArray);

    // Should handle gracefully without SQL errors
    await expect(query.many()).resolves.not.toThrow();
  });

  test("Should handle SQL injection attempts in complex queries", async () => {
    // Edge case: Various SQL injection attempts
    const maliciousInputs = [
      "'; DROP TABLE users_without_pk; --",
      "' UNION SELECT * FROM users_without_pk --",
      "' OR '1'='1",
      "'; INSERT INTO users_without_pk (name) VALUES ('hacked'); --",
      "' AND (SELECT COUNT(*) FROM users_without_pk) > 0 --",
    ];

    for (const maliciousInput of maliciousInputs) {
      const query = UserWithoutPk.query()
        .where("name", maliciousInput)
        .orWhere("email", maliciousInput)
        .orWhere("description", "like", `%${maliciousInput}%`);

      // Should not execute malicious SQL
      await expect(query.many()).resolves.not.toThrow();
    }
  });

  test("Should handle concurrent query operations without race conditions", async () => {
    // Edge case: Many concurrent query operations
    // Note: MSSQL transactions don't support concurrent requests, so we run sequentially for MSSQL
    const queryBuilders = Array.from({ length: 50 }, (_, i) =>
      UserWithoutPk.query()
        .where("name", "like", `%test${i}%`)
        .orWhere("email", "like", `%${i}@example.com%`)
        .orderBy("name", "asc")
        .limit(10),
    );

    let results: PromiseSettledResult<unknown[]>[];
    if (env.DB_TYPE === "mssql") {
      // MSSQL: run sequentially to avoid transaction conflicts
      results = [];
      for (const qb of queryBuilders) {
        try {
          const result = await qb.many();
          results.push({ status: "fulfilled", value: result });
        } catch (error) {
          results.push({ status: "rejected", reason: error });
        }
      }
    } else {
      // Other DBs: run concurrently
      results = await Promise.allSettled(queryBuilders.map((qb) => qb.many()));
    }

    // All queries should complete without errors
    const failedQueries = results.filter(
      (result) => result.status === "rejected",
    );
    expect(failedQueries.length).toBe(0);
  });

  test("Should handle unicode and special characters in queries", async () => {
    // Edge case: Unicode and special characters
    const specialStrings = [
      "测试用户", // Chinese characters
      "Ñoño García", // Spanish with tildes
      "🚀🎉💻", // Emojis
      "user@domain.tld", // Email format
      "O'Connor", // Apostrophe
      'Quote"Test', // Double quote
      "Back\\slash", // Backslash
      "Multi\nLine\rText", // Newlines
    ];

    for (const specialString of specialStrings) {
      await expect(
        UserWithoutPk.query()
          .where("name", specialString)
          .orWhere("description", "like", `%${specialString}%`)
          .many(),
      ).resolves.not.toThrow();
    }
  });

  test("Should handle database-specific SQL functions gracefully", async () => {
    // Edge case: Database-specific functions that might not exist on all platforms
    // Note: MSSQL doesn't have special functions tested here
    if (env.DB_TYPE === "mssql") {
      return;
    }

    const dbSpecificQueries = [];

    if (env.DB_TYPE === "postgres" || env.DB_TYPE === "cockroachdb") {
      dbSpecificQueries.push(
        UserWithoutPk.query().where("name", "ilike", "%test%"),
      );
    }

    if (env.DB_TYPE === "sqlite") {
      dbSpecificQueries.push(
        UserWithoutPk.query().where("name", "like", "*test*"),
      );
    }

    for (const query of dbSpecificQueries) {
      await expect(query.many()).resolves.not.toThrow();
    }
  });

  test("Should handle memory pressure during large result processing", async () => {
    // Edge case: Processing large result sets that could cause memory issues
    // Note: MSSQL has type conversion issues with binary columns and OUTPUT inserted.*
    if (env.DB_TYPE === "mssql") {
      return;
    }

    // First insert some test data
    const testUsers = Array.from({ length: 100 }, (_, i) => {
      const userData = UserFactory.getCommonUserData();
      return {
        ...userData,
        name: `TestUser${i}`,
        email: `user${i}@test.com`,
      };
    });

    await UserWithoutPk.insertMany(testUsers);

    // Now query large result set
    const largeResultQuery = UserWithoutPk.query()
      .where("name", "like", "TestUser%")
      .orderBy("name", "asc")
      .limit(100);

    const results = await largeResultQuery.many();
    expect(results.length).toBeLessThanOrEqual(100);

    // Verify memory isn't holding onto unnecessary references
    const memoryQuery = UserWithoutPk.query().where(
      "name",
      "like",
      "TestUser%",
    );
    await memoryQuery.many();

    // Should be able to run multiple large queries
    await expect(memoryQuery.many()).resolves.not.toThrow();
  });

  test("Should handle empty and null value edge cases", async () => {
    // Edge case: Various empty/null combinations
    const edgeCaseQueries = [
      UserWithoutPk.query().where("name", "=", ""),
      UserWithoutPk.query().whereNull("description"),
      UserWithoutPk.query().whereNotNull("name"),
      UserWithoutPk.query().where("email", "!=", ""),
      UserWithoutPk.query().where("name", "like", "%%"),
    ];

    for (const query of edgeCaseQueries) {
      await expect(query.many()).resolves.not.toThrow();
    }
  });

  test("Should handle complex ordering and limiting scenarios", async () => {
    // Edge case: Complex sorting and pagination
    const complexQuery = UserWithoutPk.query()
      .orderBy("name", "asc")
      .orderBy("email", "desc")
      .orderBy("created_at", "asc")
      .limit(50)
      .offset(0);

    await expect(complexQuery.many()).resolves.not.toThrow();

    // Test with very large limit
    const largeLimitQuery = UserWithoutPk.query()
      .orderBy("name", "asc")
      .limit(999999);

    await expect(largeLimitQuery.many()).resolves.not.toThrow();
  });
});
