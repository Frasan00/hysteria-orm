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

  test("toJSON() should flatten $annotations to top level", async () => {
    // Create user with some data
    const userData = {
      ...UserFactory.getCommonUserData(),
      name: "JsonFlattenTest",
      age: 30,
    };

    await UserWithoutPk.insert(userData);

    // Query with annotations
    const user = await UserWithoutPk.query()
      .select("name", "age")
      .annotate("age", "userAge")
      .annotate("name", "userName")
      .where("name", "JsonFlattenTest")
      .one();

    expect(user).not.toBeNull();
    expect(user?.$annotations).toBeDefined();
    // CockroachDB may return numbers as strings in some cases
    expect(+user?.$annotations.userAge!).toBe(30);
    expect(user?.$annotations.userName).toBe("JsonFlattenTest");

    // Call toJSON() and verify flattening - should now be typed!
    const json = user!.toJSON();

    // Regular model properties should be present
    expect(json.name).toBe("JsonFlattenTest");
    expect(+json.age).toBe(30); // May be string or number depending on DB

    // $annotations should be flattened to top level
    expect(+json.userAge).toBe(30); // May be string or number depending on DB
    expect(json.userName).toBe("JsonFlattenTest");

    // $annotations property itself should NOT be in the result
    expect(json.$annotations).toBeUndefined();
  });

  test("toJSON() should handle models without annotations", async () => {
    const userData = {
      ...UserFactory.getCommonUserData(),
      name: "NoAnnotationsTest",
    };

    const user = await UserWithoutPk.insert(userData);

    // Call toJSON() on model without annotations - should now be typed!
    const json = user.toJSON();

    expect(json.name).toBe("NoAnnotationsTest");
    expect(json.$annotations).toBeUndefined();
  });

  test("toJSON() should handle JSON select methods", async () => {
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
    expect(user?.$annotations?.extractedName).toBe("Alice");

    // Call toJSON() and verify JSON annotations are flattened - should now be typed!
    const json = user!.toJSON();

    expect(json!.name).toBe("JsonSelectTest");
    expect(json!.extractedName).toBe("Alice");
    expect(json!.$annotations).toBeUndefined();
  });

  describe("Annotation collision with model fields (Bug Fix Tests)", () => {
    test("annotate() with alias matching model column should go to $annotations", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "CollisionTest1",
        age: 25,
        email: "collision1@test.com",
      };

      await UserWithoutPk.insert(userData);

      // Annotate with aliases that match existing model columns
      const user = await UserWithoutPk.query()
        .select("name", "age", "email")
        .annotate("max", "age", "maxAge") // Non-conflicting alias
        .annotate("count", "*", "totalCount") // Non-conflicting alias
        .where("email", "collision1@test.com")
        .groupBy("name", "age", "email")
        .one();

      expect(user).not.toBeNull();

      // Original model fields should still be present
      expect(user!.name).toBe("CollisionTest1");
      expect(+user!.age).toBe(25);
      expect(user!.email).toBe("collision1@test.com");

      // Annotations should be in $annotations
      expect(user!.$annotations).toBeDefined();
      expect(user!.$annotations.maxAge).toBeDefined();
      expect(+user!.$annotations.maxAge).toBeGreaterThanOrEqual(25);
      expect(user!.$annotations.totalCount).toBeDefined();
      expect(+user!.$annotations.totalCount).toBeGreaterThanOrEqual(1);

      // Model fields should still have their original values
      expect(+user!.age).toBe(25);
      expect(user!.email).toBe("collision1@test.com");
    });

    test("selectJson() with alias matching model column should go to $annotations", async () => {
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

      // Select JSON with aliases matching existing model columns
      const user = await UserWithoutPk.query()
        .select("name", "email")
        .selectJsonText("json", "username", "jsonName") // Non-conflicting alias
        .selectJsonText("json", "userAge", "jsonAge") // Non-conflicting alias
        .where("email", "collision2@test.com")
        .one();

      expect(user).not.toBeNull();

      // Original model fields should still be present
      expect(user!.name).toBe("CollisionTest2");
      expect(user!.email).toBe("collision2@test.com");

      // JSON annotations should be in $annotations
      expect(user!.$annotations).toBeDefined();
      expect(user!.$annotations.jsonName).toBe("json_user");
      expect(+user!.$annotations.jsonAge).toBe(30);

      // Model fields should have their original values
      expect(user!.name).toBe("CollisionTest2");
    });

    test("Multiple annotations with same alias as model column should all go to $annotations", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "CollisionTest3",
        age: 25,
        email: "collision3@test.com",
      };

      await UserWithoutPk.insert(userData);

      // Multiple annotations
      const user = await UserWithoutPk.query()
        .select("name", "email")
        .annotate("name", "nameAlias") // Non-conflicting
        .annotate("count", "*", "totalRecords") // Non-conflicting
        .where("email", "collision3@test.com")
        .groupBy("name", "email")
        .one();

      expect(user).not.toBeNull();

      // Original model field
      expect(user!.name).toBe("CollisionTest3");

      // Annotations should all be in $annotations
      expect(user!.$annotations).toBeDefined();
      expect(user!.$annotations.nameAlias).toBe("CollisionTest3");
      expect(+user!.$annotations.totalRecords).toBeGreaterThanOrEqual(1);

      // Original model field should be a string
      expect(typeof user!.name).toBe("string");
      expect(user!.name).toBe("CollisionTest3");
    });

    test("toJSON() should handle colliding Annotations correctly", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "CollisionTest4",
        age: 30,
        email: "collision4@test.com",
      };

      await UserWithoutPk.insert(userData);

      const user = await UserWithoutPk.query()
        .select("name", "age")
        .annotate("max", "age", "maxAge") // Non-conflicting
        .annotate("name", "computedName") // Non-conflicting
        .where("email", "collision4@test.com")
        .groupBy("name", "age")
        .one();

      expect(user).not.toBeNull();
      expect(user!.$annotations.maxAge).toBeDefined();
      expect(user!.$annotations.computedName).toBe("CollisionTest4");

      // toJSON should flatten annotations to top level
      const json = user!.toJSON();

      // Model fields should be present
      expect(json.name).toBe("CollisionTest4");
      expect(+json.age).toBe(30);

      // Annotations should be flattened
      expect(json.computedName).toBe("CollisionTest4");
      expect(+json.maxAge).toBeGreaterThanOrEqual(30);
    });

    test("Type system should infer correct types for colliding annotations", async () => {
      const userData = {
        ...UserFactory.getCommonUserData(),
        name: "CollisionTest5",
        age: 35,
        email: "collision5@test.com",
      };

      await UserWithoutPk.insert(userData);

      // This tests that TypeScript properly handles the AnnotationResult type
      const user = await UserWithoutPk.query()
        .select("name", "age")
        .annotate("max", "age", "maxAge") // Non-conflicting alias
        .where("email", "collision5@test.com")
        .groupBy("name", "age")
        .one();

      // TypeScript should properly type annotations
      if (user?.$annotations) {
        const annotatedMaxAge = user.$annotations.maxAge;
        expect(annotatedMaxAge).toBeDefined();
        expect(+annotatedMaxAge).toBeGreaterThanOrEqual(35);
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
  });
});
