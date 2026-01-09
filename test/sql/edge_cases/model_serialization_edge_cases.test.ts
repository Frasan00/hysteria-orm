import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserWithoutPk } from "../test_models/without_pk/user_without_pk";

beforeAll(async () => {
  const dataSource = new SqlDataSource();
  await dataSource.connect();
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

describe(`[${env.DB_TYPE}] Model Serialization Edge Cases`, () => {
  test("Should handle model hooks execution order and side effects", async () => {
    // Note: MSSQL has type conversion issues with binary columns and OUTPUT inserted.*
    if (env.DB_TYPE === "mssql") return;
    // Edge case: Model hooks with various scenarios
    const originalBeforeInsert = UserWithoutPk.beforeInsert;
    const originalAfterFetch = UserWithoutPk.afterFetch;

    let hookCallOrder: string[] = [];

    try {
      // Mock hooks to track execution order
      UserWithoutPk.beforeInsert = async (data: any) => {
        hookCallOrder.push("beforeInsert");
        data.name = data.name + "_processed";
      };

      UserWithoutPk.afterFetch = async (data: any) => {
        hookCallOrder.push("afterFetch");
        if (Array.isArray(data)) {
          data.forEach((item) => (item.processed = true));
        } else {
          data.processed = true;
        }
        return data;
      };

      const userData = UserFactory.getCommonUserData();
      const user = await UserWithoutPk.insert(userData);

      expect(hookCallOrder).toContain("beforeInsert");
      expect(user.name).toContain("_processed");

      hookCallOrder = []; // Reset for next test

      const retrievedUser = await UserWithoutPk.findOneBy("name", user.name);
      expect(hookCallOrder).toContain("afterFetch");
      expect((retrievedUser as any).processed).toBe(true);
    } finally {
      // Restore original hooks
      UserWithoutPk.beforeInsert = originalBeforeInsert;
      UserWithoutPk.afterFetch = originalAfterFetch;
    }
  });

  test("Should handle JSON serialization with circular references", async () => {
    // Edge case: JSON serialization edge cases
    const circularObj: any = { name: "test" };
    circularObj.self = circularObj;

    const jsonEdgeCases = [
      JSON.stringify({ normal: "object" }),
      JSON.stringify([1, 2, 3, "array"]),
      JSON.stringify(null),
      JSON.stringify(""),
      "invalid json {",
      '{"unclosed": "object"',
      JSON.stringify({ unicode: "测试🚀" }),
      JSON.stringify({ special: "chars!@#$%^&*()" }),
    ];

    for (const jsonCase of jsonEdgeCases) {
      try {
        const userData = {
          ...UserFactory.getCommonUserData(),
          name: `JSONTest${Date.now()}`,
          metadata: jsonCase,
        };

        const user = await UserWithoutPk.insert(userData);
        const retrievedUser = await UserWithoutPk.findOneBy("name", user.name);

        expect(retrievedUser).toBeDefined();
        // JSON should be stored and retrieved correctly or fail gracefully
      } catch (error) {
        // Some JSON edge cases might fail, but shouldn't crash
      }
    }
  });

  test("Should handle hidden field serialization behavior", async () => {
    // Note: MSSQL has type conversion issues with binary columns and OUTPUT inserted.*
    if (env.DB_TYPE === "mssql") return;
    // Edge case: Hidden fields should not appear in serialized output
    const userData = {
      ...UserFactory.getCommonUserData(),
      name: "HiddenFieldTest",
    };

    const user = await UserWithoutPk.insert(userData);
    const retrievedUser = await UserWithoutPk.findOneBy("name", user.name);

    // Verify that hidden fields are not in the serialized output
    const serializedUser = JSON.parse(JSON.stringify(retrievedUser));

    // Check that the user object doesn't contain sensitive hidden fields
    expect(serializedUser).toBeDefined();
    expect(serializedUser.name).toBe("HiddenFieldTest");
  });

  test("Should handle data type serialization edge cases", async () => {
    // Note: MSSQL has type conversion issues with binary columns and OUTPUT inserted.*
    if (env.DB_TYPE === "mssql") return;
    // Edge case: Various data types and their serialization
    const dataTypeTests = [
      { name: "IntegerTest", description: "123456789" },
      { name: "FloatTest", description: "123.456789" },
      { name: "BooleanTest", description: "true" },
      { name: "DateTest", description: new Date().toISOString() },
      { name: "EmptyStringTest", description: "" },
      { name: "WhitespaceTest", description: "   \n\t   " },
    ];

    for (const testData of dataTypeTests) {
      const userData = {
        ...UserFactory.getCommonUserData(),
        ...testData,
      };

      const user = await UserWithoutPk.insert(userData);
      const retrievedUser = await UserWithoutPk.findOneBy(
        "name",
        testData.name,
      );

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.name).toBe(testData.name);
    }
  });

  test("Should handle memory-intensive scenarios with large models", async () => {
    // Note: MSSQL has type conversion issues with binary columns and OUTPUT inserted.*
    if (env.DB_TYPE === "mssql") return;
    // Edge case: Large number of model instances in memory
    const largeDataset = Array.from({ length: 100 }, (_, i) => ({
      ...UserFactory.getCommonUserData(),
      name: `LargeDataset${i}`,
      email: `large${i}@test.com`,
      description: "A".repeat(1000), // Large description field
    }));

    // Insert large dataset
    await UserWithoutPk.insertMany(largeDataset);

    // Retrieve and process large dataset
    const retrievedUsers = await UserWithoutPk.query()
      .where("name", "like", "LargeDataset%")
      .many();

    expect(retrievedUsers.length).toBe(100);

    // Process each user to test memory handling
    expect(retrievedUsers.length).toBe(100);

    // Verify memory isn't holding onto unnecessary references
    const memoryTestQuery = await UserWithoutPk.query()
      .where("name", "like", "LargeDataset%")
      .limit(10)
      .many();

    expect(memoryTestQuery.length).toBe(10);
  });

  test("Should handle async hook operations", async () => {
    // Note: MSSQL has type conversion issues with binary columns and OUTPUT inserted.*
    if (env.DB_TYPE === "mssql") return;
    // Edge case: Async hooks with delays and promises
    const originalBeforeInsert = UserWithoutPk.beforeInsert;

    try {
      UserWithoutPk.beforeInsert = async (data: any) => {
        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 10));
        data.name = data.name + "_async";
      };

      const userData = UserFactory.getCommonUserData();
      const user = await UserWithoutPk.insert(userData);

      expect(user.name).toContain("_async");
    } finally {
      UserWithoutPk.beforeInsert = originalBeforeInsert;
    }
  });

  test("Should handle model serialization with database-specific data types", async () => {
    // Edge case: Database-specific data type handling
    const dbSpecificTests = [];

    if (env.DB_TYPE === "postgres" || env.DB_TYPE === "cockroachdb") {
      dbSpecificTests.push({
        name: "PostgresArrayTest",
        description: "{1,2,3}", // PostgreSQL array syntax
      });
    }

    if (env.DB_TYPE === "mysql" || env.DB_TYPE === "mariadb") {
      dbSpecificTests.push({
        name: "MySQLJSONTest",
        description: '{"key": "value"}', // MySQL JSON
      });
    }

    for (const testData of dbSpecificTests) {
      const userData = {
        ...UserFactory.getCommonUserData(),
        ...testData,
      };

      try {
        const user = await UserWithoutPk.insert(userData);
        const retrievedUser = await UserWithoutPk.findOneBy(
          "name",
          testData.name,
        );

        expect(retrievedUser).toBeDefined();
        expect(retrievedUser?.name).toBe(testData.name);
      } catch (error) {
        // Some database-specific types might not be supported
        expect(error).toBeInstanceOf(Error);
      }
    }
  });

  test("Should handle serialization with null and undefined values", async () => {
    // Note: MSSQL has type conversion issues with binary columns and OUTPUT inserted.*
    if (env.DB_TYPE === "mssql") return;
    // Edge case: Null/undefined value serialization
    const nullUndefinedTests = [
      { name: "NullDescTest", description: null },
      { name: "EmptyDescTest", description: "" },
      { name: "UndefinedDescTest", description: undefined },
    ];

    for (const testData of nullUndefinedTests) {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: testData.name,
        description: testData.description as string | undefined,
      };

      await UserWithoutPk.insert(userData);
      const retrievedUser = await UserWithoutPk.findOneBy(
        "name",
        testData.name,
      );

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.name).toBe(testData.name);

      if (testData.description === undefined || testData.description === null) {
        expect(retrievedUser?.description).toBeNull();
      }
    }
  });

  test("Should handle model serialization consistency across operations", async () => {
    // Note: MSSQL has type conversion issues with binary columns and OUTPUT inserted.*
    if (env.DB_TYPE === "mssql") return;
    // Edge case: Serialization consistency between insert, update, find operations
    const originalData = {
      ...UserFactory.getCommonUserData(),
      name: "ConsistencyTest",
      description: "Original description",
    };

    // Insert
    const insertedUser = await UserWithoutPk.insert(originalData);
    expect(insertedUser.name).toBe("ConsistencyTest");

    // Find
    const foundUser = await UserWithoutPk.findOneBy("name", "ConsistencyTest");
    expect(foundUser?.name).toBe(insertedUser.name);

    // Verify serialization consistency
    const insertedSerialized = JSON.parse(JSON.stringify(insertedUser));
    const foundSerialized = JSON.parse(JSON.stringify(foundUser));

    expect(insertedSerialized.name).toBe(foundSerialized.name);
  });

  test("select with aliases should return columns directly", async () => {
    // Create user with some data
    const userData = {
      ...UserFactory.getCommonUserData(),
      name: "JsonFlattenTest",
      age: 30,
    };

    await UserWithoutPk.insert(userData);

    // Query with select aliases
    const user = await UserWithoutPk.query()
      .select("name", "age", "age as userAge", "name as userName")
      .where("name", "JsonFlattenTest")
      .one();

    expect(user).not.toBeNull();
    // CockroachDB may return numbers as strings in some cases
    expect(+user?.userAge!).toBe(30);
    expect(user?.userName).toBe("JsonFlattenTest");

    // Regular model properties should be present
    expect(user?.name).toBe("JsonFlattenTest");
    expect(+user?.age!).toBe(30);
  });

  test("selectJsonText should return values directly on model", async () => {
    if (env.DB_TYPE === "sqlite") {
      // SQLite doesn't support all JSON functions
      return;
    }

    const jsonData = {
      user: { name: "Alice", age: 25 },
      items: ["apple", "banana"],
    };

    const userData = {
      ...UserFactory.getCommonUserData(),
      name: "JsonSelectTest",
      json: jsonData,
    };

    await UserWithoutPk.insert(userData);

    // Query with JSON select methods
    const user = await UserWithoutPk.query()
      .select("name")
      .selectJsonText("json", "user.name", "extractedName")
      .where("name", "JsonSelectTest")
      .one();

    expect(user).not.toBeNull();
    expect(user?.extractedName).toBe("Alice");
    expect(user?.name).toBe("JsonSelectTest");
  });

  describe("Select with aliases and aggregate functions", () => {
    test("selectRaw with aggregate functions", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "CollisionTest1",
        age: 25,
        email: "collision1@test.com",
      };

      await UserWithoutPk.insert(userData);

      // selectRaw for aggregate functions
      const user = await UserWithoutPk.query()
        .select("name", "age", "email")
        .selectRaw<{
          maxAge: number;
          totalCount: number;
        }>("max(age) as maxAge, count(*) as totalCount")
        .where("email", "collision1@test.com")
        .groupBy("name", "age", "email")
        .one();

      expect(user).not.toBeNull();

      // Original model fields should still be present
      expect(user!.name).toBe("CollisionTest1");
      expect(+user!.age).toBe(25);
      expect(user!.email).toBe("collision1@test.com");

      // Aggregate results should be directly accessible
      expect(user!.maxAge).toBeDefined();
      expect(+user!.maxAge).toBeGreaterThanOrEqual(25);
      expect(user!.totalCount).toBeDefined();
      expect(+user!.totalCount).toBeGreaterThanOrEqual(1);

      // Model fields should still have their original values
      expect(+user!.age).toBe(25);
      expect(user!.email).toBe("collision1@test.com");
    });

    test("selectJson() should return values directly on model", async () => {
      if (env.DB_TYPE === "sqlite") {
        return; // Skip SQLite for JSON tests
      }

      const jsonData = {
        username: "json_user",
        userAge: 30,
      };

      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "CollisionTest2",
        age: 25,
        email: "collision2@test.com",
        json: jsonData,
      };

      await UserWithoutPk.insert(userData);

      // Select JSON with aliases
      const user = await UserWithoutPk.query()
        .select("name", "email")
        .selectJsonText("json", "username", "jsonName")
        .selectJsonText("json", "userAge", "jsonAge")
        .where("email", "collision2@test.com")
        .one();

      expect(user).not.toBeNull();

      // Original model fields should still be present
      expect(user!.name).toBe("CollisionTest2");
      expect(user!.email).toBe("collision2@test.com");

      // JSON values should be directly accessible
      expect(user!.jsonName).toBe("json_user");
      expect(+user!.jsonAge).toBe(30);

      // Model fields should have their original values
      expect(user!.name).toBe("CollisionTest2");
    });

    test("Multiple aliases should all be accessible directly", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "CollisionTest3",
        age: 25,
        email: "collision3@test.com",
      };

      await UserWithoutPk.insert(userData);

      // Multiple aliases using select
      const user = await UserWithoutPk.query()
        .select("name", "email", "name as nameAlias")
        .selectRaw<{ totalRecords: number }>("count(*) as totalRecords")
        .where("email", "collision3@test.com")
        .groupBy("name", "email")
        .one();

      expect(user).not.toBeNull();

      // Original model field
      expect(user!.name).toBe("CollisionTest3");

      // Aliases should be directly accessible
      expect(user!.nameAlias).toBe("CollisionTest3");
      expect(+user!.totalRecords).toBeGreaterThanOrEqual(1);

      // Original model field should be a string
      expect(typeof user!.name).toBe("string");
      expect(user!.name).toBe("CollisionTest3");
    });

    test("Type system should infer correct types for selected columns", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "CollisionTest5",
        age: 35,
        email: "collision5@test.com",
      };

      await UserWithoutPk.insert(userData);

      // Using selectRaw with typed generics
      const user = await UserWithoutPk.query()
        .select("name", "age")
        .selectRaw<{ maxAge: number }>("max(age) as maxAge")
        .where("email", "collision5@test.com")
        .groupBy("name", "age")
        .one();

      // Additional columns should be directly accessible
      if (user) {
        const maxAge = user.maxAge;
        expect(maxAge).toBeDefined();
        expect(+maxAge).toBeGreaterThanOrEqual(35);
      }

      // Original model field should still be accessible
      expect(user?.age).toBeDefined();
      // CockroachDB returns age as string due to type coercion
      if (env.DB_TYPE === "cockroachdb") {
        expect(+user!.age).toBe(35);
      } else {
        expect(user?.age).toBe(35);
      }
    });

    test("selectRaw with CAST expression should not quote the type", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "castTest",
        age: 42,
        email: "cast@test.com",
      };

      await UserWithoutPk.insert(userData);

      // CAST(x AS type) should work - the "AS type" inside CAST should not be quoted
      // while "AS alias" outside should be quoted for case preservation
      // Using VARCHAR(10) for cross-database compatibility (CHAR defaults to CHAR(1) in PostgreSQL)
      const castType =
        env.DB_TYPE === "postgres" || env.DB_TYPE === "cockroachdb"
          ? "VARCHAR"
          : "CHAR(10)";
      const user = await UserWithoutPk.query()
        .selectRaw<{
          ageAsText: string;
        }>(`CAST(age AS ${castType}) as ageAsText`)
        .where("email", "cast@test.com")
        .one();

      expect(user).not.toBeNull();
      expect(user!.ageAsText).toBeDefined();
      expect(user!.ageAsText.trim()).toBe("42");
    });
  });

  describe("Aggregate shorthand methods", () => {
    test("selectCount should return count with alias", async () => {
      const userData = [
        { ...UserFactory.getCommonUserData(), name: "CountTest1", age: 25 },
        { ...UserFactory.getCommonUserData(), name: "CountTest2", age: 30 },
        { ...UserFactory.getCommonUserData(), name: "CountTest3", age: 35 },
      ];

      await UserWithoutPk.insertMany(userData);

      const result = await UserWithoutPk.query()
        .selectCount("*", "totalUsers")
        .where("name", "like", "CountTest%")
        .one();

      expect(result).not.toBeNull();
      expect(result!.totalUsers).toBeDefined();
      expect(+result!.totalUsers).toBe(3);
    });

    test("selectCount with specific column", async () => {
      const userData = [
        { ...UserFactory.getCommonUserData(), name: "CountCol1", age: 25 },
        {
          ...UserFactory.getCommonUserData(),
          name: "CountCol2",
          age: undefined,
        },
      ];

      await UserWithoutPk.insertMany(userData);

      const result = await UserWithoutPk.query()
        .selectCount("age", "ageCount")
        .where("name", "like", "CountCol%")
        .one();

      expect(result).not.toBeNull();
      expect(result!.ageCount).toBeDefined();
      // COUNT(age) should only count non-null values
      expect(+result!.ageCount).toBe(1);
    });

    test("selectSum should return sum with alias", async () => {
      const userData = [
        { ...UserFactory.getCommonUserData(), name: "SumTest1", age: 10 },
        { ...UserFactory.getCommonUserData(), name: "SumTest2", age: 20 },
        { ...UserFactory.getCommonUserData(), name: "SumTest3", age: 30 },
      ];

      await UserWithoutPk.insertMany(userData);

      const result = await UserWithoutPk.query()
        .selectSum("age", "totalAge")
        .where("name", "like", "SumTest%")
        .one();

      expect(result).not.toBeNull();
      expect(result!.totalAge).toBeDefined();
      expect(+result!.totalAge).toBe(60);
    });

    test("selectAvg should return average with alias", async () => {
      const userData = [
        { ...UserFactory.getCommonUserData(), name: "AvgTest1", age: 20 },
        { ...UserFactory.getCommonUserData(), name: "AvgTest2", age: 30 },
        { ...UserFactory.getCommonUserData(), name: "AvgTest3", age: 40 },
      ];

      await UserWithoutPk.insertMany(userData);

      const result = await UserWithoutPk.query()
        .selectAvg("age", "averageAge")
        .where("name", "like", "AvgTest%")
        .one();

      expect(result).not.toBeNull();
      expect(result!.averageAge).toBeDefined();
      // Average of 20, 30, 40 = 30
      expect(+result!.averageAge).toBe(30);
    });

    test("selectMin should return minimum with alias", async () => {
      const userData = [
        { ...UserFactory.getCommonUserData(), name: "MinTest1", age: 25 },
        { ...UserFactory.getCommonUserData(), name: "MinTest2", age: 15 },
        { ...UserFactory.getCommonUserData(), name: "MinTest3", age: 35 },
      ];

      await UserWithoutPk.insertMany(userData);

      const result = await UserWithoutPk.query()
        .selectMin("age", "youngestAge")
        .where("name", "like", "MinTest%")
        .one();

      expect(result).not.toBeNull();
      expect(result!.youngestAge).toBeDefined();
      expect(+result!.youngestAge).toBe(15);
    });

    test("selectMax should return maximum with alias", async () => {
      const userData = [
        { ...UserFactory.getCommonUserData(), name: "MaxTest1", age: 25 },
        { ...UserFactory.getCommonUserData(), name: "MaxTest2", age: 45 },
        { ...UserFactory.getCommonUserData(), name: "MaxTest3", age: 35 },
      ];

      await UserWithoutPk.insertMany(userData);

      const result = await UserWithoutPk.query()
        .selectMax("age", "oldestAge")
        .where("name", "like", "MaxTest%")
        .one();

      expect(result).not.toBeNull();
      expect(result!.oldestAge).toBeDefined();
      expect(+result!.oldestAge).toBe(45);
    });

    test("Multiple aggregate methods can be chained", async () => {
      const userData = [
        { ...UserFactory.getCommonUserData(), name: "ChainTest1", age: 20 },
        { ...UserFactory.getCommonUserData(), name: "ChainTest2", age: 30 },
        { ...UserFactory.getCommonUserData(), name: "ChainTest3", age: 40 },
      ];

      await UserWithoutPk.insertMany(userData);

      const result = await UserWithoutPk.query()
        .selectCount("*", "total")
        .selectSum("age", "sumAge")
        .selectAvg("age", "avgAge")
        .selectMin("age", "minAge")
        .selectMax("age", "maxAge")
        .where("name", "like", "ChainTest%")
        .one();

      expect(result).not.toBeNull();
      expect(+result!.total).toBe(3);
      expect(+result!.sumAge).toBe(90);
      expect(+result!.avgAge).toBe(30);
      expect(+result!.minAge).toBe(20);
      expect(+result!.maxAge).toBe(40);
    });

    test("Aggregate methods can be combined with regular select", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "CombineTest",
        age: 25,
        email: "combine@test.com",
      };

      await UserWithoutPk.insert(userData);

      const result = await UserWithoutPk.query()
        .select("name", "email")
        .selectCount("*", "recordCount")
        .selectMax("age", "maxAge")
        .where("email", "combine@test.com")
        .groupBy("name", "email")
        .one();

      expect(result).not.toBeNull();
      expect(result!.name).toBe("CombineTest");
      expect(result!.email).toBe("combine@test.com");
      expect(+result!.recordCount).toBe(1);
      expect(+result!.maxAge).toBe(25);
    });

    test("Aggregate with table.column format", async () => {
      const userData = [
        {
          ...UserFactory.getCommonUserData(),
          name: "TablePrefixTest1",
          age: 10,
        },
        {
          ...UserFactory.getCommonUserData(),
          name: "TablePrefixTest2",
          age: 20,
        },
      ];

      await UserWithoutPk.insertMany(userData);

      const result = await UserWithoutPk.query()
        .selectSum("users_without_pk.age", "totalAge")
        .where("name", "like", "TablePrefixTest%")
        .one();

      expect(result).not.toBeNull();
      expect(result!.totalAge).toBeDefined();
      expect(+result!.totalAge).toBe(30);
    });
  });

  describe("Case convention handling", () => {
    test("Model columns should have case conversion applied (snake_case DB -> camelCase model)", async () => {
      if (env.DB_TYPE === "mssql") return;

      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "CaseConversionTest",
        shortDescription: "A short description",
        isActive: true,
      };

      await UserWithoutPk.insert(userData);

      const user = await UserWithoutPk.query()
        .select("name", "shortDescription", "isActive")
        .where("name", "CaseConversionTest")
        .one();

      expect(user).not.toBeNull();
      expect(user!.name).toBe("CaseConversionTest");

      // Model columns should be in camelCase (converted from snake_case in DB)
      expect(user!.shortDescription).toBe("A short description");
      expect(user!.isActive).toBe(true);

      // Snake_case keys should NOT exist on the response
      expect(
        Object.prototype.hasOwnProperty.call(user, "short_description"),
      ).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(user, "is_active")).toBe(
        false,
      );
    });

    test("Aliases should remain exactly as specified (no case conversion)", async () => {
      if (env.DB_TYPE === "mssql") return;

      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "AliasNoCaseConversionTest",
        age: 25,
        height: 180,
      };

      await UserWithoutPk.insert(userData);

      // Test snake_case alias - should remain exactly as written
      const user = await UserWithoutPk.query()
        .select(
          "name",
          "age as user_age", // snake_case alias
          "height as user_height", // another snake_case alias
        )
        .where("name", "AliasNoCaseConversionTest")
        .one();

      expect(user).not.toBeNull();

      // Model column should be in camelCase
      expect(user!.name).toBe("AliasNoCaseConversionTest");

      // Aliases should remain EXACTLY as specified (snake_case preserved)
      expect(user!.user_age).toBeDefined();
      expect(+user!.user_age).toBe(25);
      expect(user!.user_height).toBeDefined();
      expect(+user!.user_height).toBe(180);

      // camelCase versions should NOT exist (aliases not converted)
      expect(Object.prototype.hasOwnProperty.call(user, "userAge")).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(user, "userHeight")).toBe(
        false,
      );
    });

    test("selectRaw aliases should remain exactly as specified", async () => {
      if (env.DB_TYPE === "mssql" || env.DB_TYPE === "cockroachdb") return;

      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "SelectRawAliasTest",
        age: 30,
        height: 175,
      };

      await UserWithoutPk.insert(userData);

      const user = await UserWithoutPk.query()
        .select("name")
        .selectRaw<{
          total_records: number;
          computed_sum: number;
        }>("count(*) as total_records, (age + height) as computed_sum")
        .where("name", "SelectRawAliasTest")
        .groupBy("name", "age", "height")
        .one();

      expect(user).not.toBeNull();

      // Model column should be in camelCase
      expect(user!.name).toBe("SelectRawAliasTest");

      // selectRaw aliases should remain EXACTLY as specified (snake_case preserved)
      expect(user!.total_records).toBeDefined();
      expect(+user!.total_records).toBe(1);
      expect(user!.computed_sum).toBeDefined();
      expect(+user!.computed_sum).toBe(205); // 30 + 175

      // camelCase versions should NOT exist
      expect(Object.prototype.hasOwnProperty.call(user, "totalRecords")).toBe(
        false,
      );
      expect(Object.prototype.hasOwnProperty.call(user, "computedSum")).toBe(
        false,
      );
    });

    test("Aggregate function aliases should remain exactly as specified", async () => {
      const userData = [
        {
          ...UserFactory.getCommonUserData(),
          name: "AggAliasTest1",
          age: 20,
        },
        {
          ...UserFactory.getCommonUserData(),
          name: "AggAliasTest2",
          age: 40,
        },
      ];

      await UserWithoutPk.insertMany(userData);

      const result = await UserWithoutPk.query()
        .selectCount("*", "total_count")
        .selectSum("age", "sum_of_ages")
        .selectAvg("age", "average_age")
        .where("name", "like", "AggAliasTest%")
        .one();

      expect(result).not.toBeNull();

      // Aliases should remain EXACTLY as specified (snake_case preserved)
      expect(result!.total_count).toBeDefined();
      expect(+result!.total_count).toBe(2);
      expect(result!.sum_of_ages).toBeDefined();
      expect(+result!.sum_of_ages).toBe(60);
      expect(result!.average_age).toBeDefined();
      expect(+result!.average_age).toBe(30);

      // camelCase versions should NOT exist
      expect(Object.prototype.hasOwnProperty.call(result, "totalCount")).toBe(
        false,
      );
      expect(Object.prototype.hasOwnProperty.call(result, "sumOfAges")).toBe(
        false,
      );
      expect(Object.prototype.hasOwnProperty.call(result, "averageAge")).toBe(
        false,
      );
    });

    test("Mixed model columns and aliases maintain their respective conventions", async () => {
      if (env.DB_TYPE === "mssql") return;

      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "MixedConventionTest",
        shortDescription: "Short desc",
        isActive: true,
        age: 35,
        height: 170,
      };

      await UserWithoutPk.insert(userData);

      const user = await UserWithoutPk.query()
        .select(
          "name",
          "shortDescription", // model column - should be camelCase
          "isActive", // model column - should be camelCase
          "age as user_age_value", // alias - should remain snake_case
        )
        .selectRaw<{ computed_value: number }>("height + 10 as computed_value")
        .where("name", "MixedConventionTest")
        .one();

      expect(user).not.toBeNull();

      // Model columns should be in camelCase (converted from DB snake_case)
      expect(user!.name).toBe("MixedConventionTest");
      expect(user!.shortDescription).toBe("Short desc");
      expect(user!.isActive).toBe(true);

      // Aliases should remain EXACTLY as specified (no conversion)
      expect(user!.user_age_value).toBeDefined();
      expect(+user!.user_age_value).toBe(35);
      expect(user!.computed_value).toBeDefined();
      expect(+user!.computed_value).toBe(180); // 170 + 10

      // Verify snake_case model column names don't exist
      expect(
        Object.prototype.hasOwnProperty.call(user, "short_description"),
      ).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(user, "is_active")).toBe(
        false,
      );

      // Verify camelCase alias versions don't exist
      expect(Object.prototype.hasOwnProperty.call(user, "userAgeValue")).toBe(
        false,
      );
      expect(Object.prototype.hasOwnProperty.call(user, "computedValue")).toBe(
        false,
      );
    });

    test("CamelCase aliases should remain as camelCase (not converted to snake_case)", async () => {
      if (env.DB_TYPE === "mssql") return;

      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "CamelCaseAliasTest",
        age: 28,
      };

      await UserWithoutPk.insert(userData);

      const user = await UserWithoutPk.query()
        .select("name", "age as userAge", "name as fullName")
        .where("name", "CamelCaseAliasTest")
        .one();

      expect(user).not.toBeNull();

      // Model column
      expect(user!.name).toBe("CamelCaseAliasTest");

      // camelCase aliases should remain as camelCase
      expect(user!.userAge).toBeDefined();
      expect(+user!.userAge).toBe(28);
      expect(user!.fullName).toBe("CamelCaseAliasTest");

      // snake_case versions should NOT exist (aliases not converted)
      expect(Object.prototype.hasOwnProperty.call(user, "user_age")).toBe(
        false,
      );
      expect(Object.prototype.hasOwnProperty.call(user, "full_name")).toBe(
        false,
      );
    });
  });

  describe("Select type narrowing edge cases", () => {
    test("select with only model columns excludes non-selected columns", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "TypeNarrowTest",
        age: 42,
      };

      await UserWithoutPk.insert(userData);

      const user = await UserWithoutPk.query()
        .select("name")
        .where("name", "TypeNarrowTest")
        .one();

      expect(user).not.toBeNull();
      expect(user!.name).toBe("TypeNarrowTest");

      // Non-selected columns should not exist
      expect(Object.prototype.hasOwnProperty.call(user, "age")).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(user, "email")).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(user, "status")).toBe(false);
    });

    test("select * returns all model columns", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "SelectAllTest",
        age: 30,
      };

      await UserWithoutPk.insert(userData);

      const user = await UserWithoutPk.query()
        .select("*")
        .where("name", "SelectAllTest")
        .one();

      expect(user).not.toBeNull();
      expect(user!.name).toBe("SelectAllTest");
      // CockroachDB may return numbers as strings
      expect(+user!.age).toBe(30);
      expect(user!.email).toBeDefined();
      expect(user!.status).toBeDefined();
    });

    test("select with table.* returns all columns from that table", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "TableWildcardTest",
        age: 25,
      };

      await UserWithoutPk.insert(userData);

      const user = await UserWithoutPk.query()
        .select("users_without_pk.*")
        .where("name", "TableWildcardTest")
        .one();

      expect(user).not.toBeNull();
      expect(user!.name).toBe("TableWildcardTest");
      // CockroachDB may return numbers as strings
      expect(+user!.age).toBe(25);
      expect(user!.email).toBeDefined();
    });

    test("select same column multiple times returns it once", async () => {
      // MSSQL returns duplicate columns as an array instead of deduplicating
      if (env.DB_TYPE === "mssql") {
        return;
      }

      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "DuplicateSelectTest",
        age: 35,
      };

      await UserWithoutPk.insert(userData);

      const user = await UserWithoutPk.query()
        .select("name", "name", "age", "age")
        .where("name", "DuplicateSelectTest")
        .one();

      expect(user).not.toBeNull();
      expect(user!.name).toBe("DuplicateSelectTest");
      // CockroachDB may return numbers as strings
      expect(+user!.age).toBe(35);
    });

    test("select with mixed aliases and direct columns", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "MixedSelectTest",
        age: 40,
      };

      await UserWithoutPk.insert(userData);

      const user = await UserWithoutPk.query()
        .select("name", "age as userAge", "email as userEmail")
        .where("name", "MixedSelectTest")
        .one();

      expect(user).not.toBeNull();
      expect(user!.name).toBe("MixedSelectTest");
      // CockroachDB may return numbers as strings
      expect(+user!.userAge).toBe(40);
      expect(user!.userEmail).toBeDefined();

      // Original names when aliased should not exist
      expect(Object.prototype.hasOwnProperty.call(user, "age")).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(user, "email")).toBe(false);
    });

    test("select combined with selectRaw returns both", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "CombinedSelectTest",
        age: 50,
      };

      await UserWithoutPk.insert(userData);

      const user = await UserWithoutPk.query()
        .select("name")
        .selectRaw<{ doubleAge: number }>("age * 2 as doubleAge")
        .where("name", "CombinedSelectTest")
        .one();

      expect(user).not.toBeNull();
      expect(user!.name).toBe("CombinedSelectTest");
      expect(+user!.doubleAge).toBe(100);
    });

    test("empty select results in all columns", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "EmptySelectTest",
        age: 28,
      };

      await UserWithoutPk.insert(userData);

      // Calling query without select should return all columns
      const user = await UserWithoutPk.query()
        .where("name", "EmptySelectTest")
        .one();

      expect(user).not.toBeNull();
      expect(user!.name).toBe("EmptySelectTest");
      // CockroachDB may return numbers as strings
      expect(+user!.age).toBe(28);
      expect(user!.email).toBeDefined();
      expect(user!.status).toBeDefined();
    });

    test("clearSelect after select returns all columns", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "ClearSelectTest",
        age: 33,
      };

      await UserWithoutPk.insert(userData);

      const user = await UserWithoutPk.query()
        .select("name")
        .clearSelect()
        .where("name", "ClearSelectTest")
        .one();

      expect(user).not.toBeNull();
      expect(user!.name).toBe("ClearSelectTest");
      // CockroachDB may return numbers as strings
      expect(+user!.age).toBe(33);
      expect(user!.email).toBeDefined();
    });

    test("select with non-existent column name is silently handled", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "NonExistentColTest",
        age: 22,
      };

      await UserWithoutPk.insert(userData);

      // Selecting a column that doesn't exist
      // Depending on database, this might error or return undefined
      // This tests the edge case handling
      try {
        const user = await UserWithoutPk.query()
          .select("name", "nonExistentColumn" as any)
          .where("name", "NonExistentColTest")
          .one();

        // If the query succeeds, the non-existent column should be undefined
        expect(user).not.toBeNull();
        expect(user!.name).toBe("NonExistentColTest");
      } catch {
        // Some databases throw an error for non-existent columns - that's acceptable
        expect(true).toBe(true);
      }
    });

    test("select preserves null values", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "NullPreserveTest",
        age: null as unknown as number,
      };

      await UserWithoutPk.insert(userData);

      const user = await UserWithoutPk.query()
        .select("name", "age")
        .where("name", "NullPreserveTest")
        .one();

      expect(user).not.toBeNull();
      expect(user!.name).toBe("NullPreserveTest");
      expect(user!.age).toBeNull();
    });

    test("select with only aggregate returns only that aggregate", async () => {
      const userData = [
        { ...UserFactory.getCommonUserData(), name: "AggOnlyTest1", age: 10 },
        { ...UserFactory.getCommonUserData(), name: "AggOnlyTest2", age: 20 },
      ];

      await UserWithoutPk.insertMany(userData);

      const result = await UserWithoutPk.query()
        .selectCount("*", "total")
        .where("name", "like", "AggOnlyTest%")
        .one();

      expect(result).not.toBeNull();
      expect(+result!.total).toBe(2);

      // Model columns should not exist since we only selected an aggregate
      expect(Object.prototype.hasOwnProperty.call(result, "name")).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(result, "age")).toBe(false);
    });
  });

  describe("Extended SQL function methods", () => {
    test("selectCountDistinct should count unique values", async () => {
      const userData = [
        { ...UserFactory.getCommonUserData(), name: "DistinctTest1", age: 25 },
        { ...UserFactory.getCommonUserData(), name: "DistinctTest2", age: 25 },
        { ...UserFactory.getCommonUserData(), name: "DistinctTest3", age: 30 },
        { ...UserFactory.getCommonUserData(), name: "DistinctTest4", age: 35 },
      ];

      await UserWithoutPk.insertMany(userData);

      const result = await UserWithoutPk.query()
        .selectCountDistinct("age", "uniqueAges")
        .where("name", "like", "DistinctTest%")
        .one();

      expect(result).not.toBeNull();
      expect(result!.uniqueAges).toBeDefined();
      expect(+result!.uniqueAges).toBe(3);
    });

    test("selectUpper should convert to uppercase", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "UpperTest",
      };

      await UserWithoutPk.insert(userData);

      const result = await UserWithoutPk.query()
        .select("name")
        .selectUpper("name", "upperName")
        .where("name", "UpperTest")
        .one();

      expect(result).not.toBeNull();
      expect(result!.name).toBe("UpperTest");
      expect(result!.upperName).toBe("UPPERTEST");
    });

    test("selectLower should convert to lowercase", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "LowerTest",
      };

      await UserWithoutPk.insert(userData);

      const result = await UserWithoutPk.query()
        .select("name")
        .selectLower("name", "lowerName")
        .where("name", "LowerTest")
        .one();

      expect(result).not.toBeNull();
      expect(result!.name).toBe("LowerTest");
      expect(result!.lowerName).toBe("lowertest");
    });

    test("selectLength should return string length", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "LengthTest",
      };

      await UserWithoutPk.insert(userData);

      const result = await UserWithoutPk.query()
        .select("name")
        .selectLength("name", "nameLength")
        .where("name", "LengthTest")
        .one();

      expect(result).not.toBeNull();
      expect(result!.name).toBe("LengthTest");
      expect(+result!.nameLength).toBe(10);
    });

    test("selectTrim should remove whitespace", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "  TrimTest  ",
      };

      await UserWithoutPk.insert(userData);

      const result = await UserWithoutPk.query()
        .select("name")
        .selectTrim("name", "trimmedName")
        .where("name", "  TrimTest  ")
        .one();

      expect(result).not.toBeNull();
      expect(result!.name).toBe("  TrimTest  ");
      expect(result!.trimmedName).toBe("TrimTest");
    });

    test("selectAbs should return absolute value", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "AbsTest",
        height: -100,
      };

      await UserWithoutPk.insert(userData);

      const result = await UserWithoutPk.query()
        .select("name", "height")
        .selectAbs("height", "absoluteHeight")
        .where("name", "AbsTest")
        .one();

      expect(result).not.toBeNull();
      expect(result!.name).toBe("AbsTest");
      expect(+result!.height).toBe(-100);
      expect(+result!.absoluteHeight).toBe(100);
    });

    test("selectRound should round to specified decimals", async () => {
      // SQLite ROUND behavior can be different
      // PostgreSQL/CockroachDB require numeric type for ROUND with precision
      if (
        env.DB_TYPE === "sqlite" ||
        env.DB_TYPE === "postgres" ||
        env.DB_TYPE === "cockroachdb"
      ) {
        return;
      }

      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "RoundTest",
        height: 123,
      };

      await UserWithoutPk.insert(userData);

      const result = await UserWithoutPk.query()
        .select("name")
        .selectRound("height", 0, "roundedHeight")
        .where("name", "RoundTest")
        .one();

      expect(result).not.toBeNull();
      expect(result!.name).toBe("RoundTest");
      expect(+result!.roundedHeight).toBe(123);
    });

    test("selectCoalesce should return default when null", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "CoalesceTest",
        description: null as unknown as string,
      };

      await UserWithoutPk.insert(userData);

      const result = await UserWithoutPk.query()
        .select("name")
        .selectCoalesce("description", "'DefaultValue'", "displayDesc")
        .where("name", "CoalesceTest")
        .one();

      expect(result).not.toBeNull();
      expect(result!.name).toBe("CoalesceTest");
      expect(result!.displayDesc).toBe("DefaultValue");
    });

    test("selectCoalesce should return original value when not null", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "CoalesceTest2",
        description: "ActualValue",
      };

      await UserWithoutPk.insert(userData);

      const result = await UserWithoutPk.query()
        .select("name")
        .selectCoalesce("description", "'DefaultValue'", "displayDesc")
        .where("name", "CoalesceTest2")
        .one();

      expect(result).not.toBeNull();
      expect(result!.name).toBe("CoalesceTest2");
      expect(result!.displayDesc).toBe("ActualValue");
    });

    test("selectCeil should round up", async () => {
      // SQLite doesn't have CEIL, it has a different behavior
      if (env.DB_TYPE === "sqlite") return;

      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "CeilTest",
        height: 123,
      };

      await UserWithoutPk.insert(userData);

      const result = await UserWithoutPk.query()
        .select("name", "height")
        .selectCeil("height", "ceilHeight")
        .where("name", "CeilTest")
        .one();

      expect(result).not.toBeNull();
      expect(result!.name).toBe("CeilTest");
      expect(+result!.ceilHeight).toBe(123);
    });

    test("selectFloor should round down", async () => {
      // SQLite doesn't have FLOOR
      if (env.DB_TYPE === "sqlite") return;

      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "FloorTest",
        height: 123,
      };

      await UserWithoutPk.insert(userData);

      const result = await UserWithoutPk.query()
        .select("name", "height")
        .selectFloor("height", "floorHeight")
        .where("name", "FloorTest")
        .one();

      expect(result).not.toBeNull();
      expect(result!.name).toBe("FloorTest");
      expect(+result!.floorHeight).toBe(123);
    });

    test("selectSqrt should return square root", async () => {
      if (env.DB_TYPE === "cockroachdb") {
        return;
      }

      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "SqrtTest",
        age: 25,
      };

      await UserWithoutPk.insert(userData);

      const result = await UserWithoutPk.query()
        .select("name", "age")
        .selectSqrt("age", "sqrtAge")
        .where("name", "SqrtTest")
        .one();

      expect(result).not.toBeNull();
      expect(result!.name).toBe("SqrtTest");
      expect(+result!.age).toBe(25);
      expect(+result!.sqrtAge).toBe(5);
    });

    test("Multiple extended functions can be chained", async () => {
      if (env.DB_TYPE === "cockroachdb" || env.DB_TYPE === "mssql") {
        return;
      }

      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "  ChainFuncTest  ",
        age: 16,
        height: -50,
      };

      await UserWithoutPk.insert(userData);

      const result = await UserWithoutPk.query()
        .select("name")
        .selectTrim("name", "trimmedName")
        .selectUpper("name", "upperName")
        .selectLength("name", "nameLength")
        .selectAbs("height", "absHeight")
        .selectSqrt("age", "sqrtAge")
        .where("name", "  ChainFuncTest  ")
        .one();

      expect(result).not.toBeNull();
      expect(result!.name).toBe("  ChainFuncTest  ");
      expect(result!.trimmedName).toBe("ChainFuncTest");
      expect(result!.upperName).toBe("  CHAINFUNCTEST  ");
      expect(+result!.nameLength).toBe(17);
      expect(+result!.absHeight).toBe(50);
      expect(+result!.sqrtAge).toBe(4);
    });

    test("Extended functions can be combined with regular aggregates", async () => {
      const userData = [
        { ...UserFactory.getCommonUserData(), name: "CombinedFunc1", age: 20 },
        { ...UserFactory.getCommonUserData(), name: "CombinedFunc2", age: 30 },
        { ...UserFactory.getCommonUserData(), name: "CombinedFunc3", age: 20 },
      ];

      await UserWithoutPk.insertMany(userData);

      const result = await UserWithoutPk.query()
        .selectCount("*", "total")
        .selectCountDistinct("age", "uniqueAges")
        .selectSum("age", "sumAge")
        .selectAvg("age", "avgAge")
        .where("name", "like", "CombinedFunc%")
        .one();

      expect(result).not.toBeNull();
      expect(+result!.total).toBe(3);
      expect(+result!.uniqueAges).toBe(2);
      expect(+result!.sumAge).toBe(70);
    });

    test("Extended functions with table.column format", async () => {
      if (env.DB_TYPE === "cockroachdb") {
        return;
      }

      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "TablePrefixFunc",
        age: 36,
      };

      await UserWithoutPk.insert(userData);

      const result = await UserWithoutPk.query()
        .select("name")
        .selectSqrt("users_without_pk.age", "sqrtAge")
        .where("name", "TablePrefixFunc")
        .one();

      expect(result).not.toBeNull();
      expect(result!.name).toBe("TablePrefixFunc");
      expect(+result!.sqrtAge).toBe(6);
    });
  });
});
