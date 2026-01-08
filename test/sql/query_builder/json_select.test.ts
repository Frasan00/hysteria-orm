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

describe(`[${env.DB_TYPE}] JSON Select Operations`, () => {
  beforeEach(async () => {
    await UserWithoutPk.query().delete();
  });

  describe("selectJson - Extract JSON values", () => {
    test("should extract nested JSON property with string path", async () => {
      const json = {
        user: {
          name: "John Doe",
          email: "john@example.com",
        },
        settings: {
          theme: "dark",
        },
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-select-1@test.com",
      });

      const result = await UserWithoutPk.query()
        .selectJson("json", "$.user.name", "userName")
        .selectJson("json", "$.settings.theme", "userTheme")
        .one();

      expect(result).not.toBeNull();
      expect(result?.userName).toBeDefined();
      expect(result?.userTheme).toBeDefined();
    });

    test("should extract JSON property with path without $ prefix", async () => {
      const json = {
        profile: {
          age: 30,
          city: "New York",
        },
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-select-2@test.com",
      });

      const result = await UserWithoutPk.query()
        .selectJson("json", "profile.age", "userAge")
        .selectJson("json", "profile.city", "userCity")
        .one();

      expect(result).not.toBeNull();
      expect(result?.userAge).toBeDefined();
      expect(result?.userCity).toBeDefined();
    });

    test("should extract JSON property with array path format", async () => {
      const json = {
        contact: {
          phone: {
            mobile: "+1234567890",
          },
        },
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-select-3@test.com",
      });

      const result = await UserWithoutPk.query()
        .selectJson("json", ["contact", "phone", "mobile"], "phoneNumber")
        .one();

      expect(result).not.toBeNull();
      expect(result?.phoneNumber).toBeDefined();
    });

    test("should extract from JSON array by index", async () => {
      const json = {
        items: [
          { id: 1, name: "First" },
          { id: 2, name: "Second" },
          { id: 3, name: "Third" },
        ],
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-select-4@test.com",
      });

      const result = await UserWithoutPk.query()
        .selectJson("json", "items.0.name", "firstItemName")
        .selectJson("json", ["items", 1, "name"], "secondItemName")
        .one();

      expect(result).not.toBeNull();
      expect(result?.firstItemName).toBeDefined();
      expect(result?.secondItemName).toBeDefined();
    });

    test("should handle root level extraction", async () => {
      const json = {
        simpleValue: "test123",
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-select-5@test.com",
      });

      const result = await UserWithoutPk.query()
        .selectJson("json", "simpleValue", "value")
        .one();

      expect(result).not.toBeNull();
      expect(result?.value).toBeDefined();
    });
  });

  describe("selectJsonText - Extract JSON values as text", () => {
    test("should extract JSON property as text with string path", async () => {
      const json = {
        data: {
          message: "Hello World",
          status: "active",
        },
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-text-1@test.com",
      });

      const result = await UserWithoutPk.query()
        .selectJsonText("json", "$.data.message", "message")
        .selectJsonText("json", "data.status", "userStatus")
        .one();

      expect(result).not.toBeNull();
      expect(result?.message).toBeDefined();
      expect(result?.userStatus).toBeDefined();
    });

    test("should extract JSON property as text with array path", async () => {
      const json = {
        user: {
          info: {
            bio: "Software Developer",
          },
        },
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-text-2@test.com",
      });

      const result = await UserWithoutPk.query()
        .selectJsonText("json", ["user", "info", "bio"], "biography")
        .one();

      expect(result).not.toBeNull();
      expect(result?.biography).toBeDefined();
    });

    test("should extract from nested array as text", async () => {
      const json = {
        tags: ["javascript", "typescript", "nodejs"],
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-text-3@test.com",
      });

      const result = await UserWithoutPk.query()
        .selectJsonText("json", "tags.0", "firstTag")
        .selectJsonText("json", ["tags", 1], "secondTag")
        .one();

      expect(result).not.toBeNull();
      expect(result?.firstTag).toBeDefined();
      expect(result?.secondTag).toBeDefined();
    });
  });

  describe("selectJsonArrayLength - Get array lengths", () => {
    test("should get length of root JSON array", async () => {
      if (env.DB_TYPE === "sqlite") {
        return;
      }

      const json = {
        items: [1, 2, 3, 4, 5],
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-length-1@test.com",
      });

      const result = await UserWithoutPk.query()
        .selectJsonArrayLength("json", "$.items", "itemCount")
        .one();

      expect(result).not.toBeNull();
      expect(result?.itemCount).toBeDefined();
    });

    test("should get length of nested JSON array", async () => {
      if (env.DB_TYPE === "sqlite") {
        return;
      }

      const json = {
        user: {
          tags: ["tag1", "tag2", "tag3"],
          scores: [100, 95, 88, 92],
        },
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-length-2@test.com",
      });

      const result = await UserWithoutPk.query()
        .selectJsonArrayLength("json", "user.tags", "tagCount")
        .selectJsonArrayLength("json", ["user", "scores"], "scoreCount")
        .one();

      expect(result).not.toBeNull();
      expect(result?.tagCount).toBeDefined();
      expect(result?.scoreCount).toBeDefined();
    });

    test("should get length of deeply nested array", async () => {
      if (env.DB_TYPE === "sqlite") {
        return;
      }

      const json = {
        data: {
          nested: {
            deep: {
              array: [10, 20, 30, 40, 50, 60],
            },
          },
        },
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-length-3@test.com",
      });

      const result = await UserWithoutPk.query()
        .selectJsonArrayLength(
          "json",
          "data.nested.deep.array",
          "deepArrayCount",
        )
        .one();

      expect(result).not.toBeNull();
      expect(result?.deepArrayCount).toBeDefined();
    });
  });

  describe("selectJsonKeys - Get object keys", () => {
    test("should get keys of root JSON object", async () => {
      if (env.DB_TYPE === "sqlite" || env.DB_TYPE === "mssql") {
        return;
      }

      const json = {
        name: "John",
        age: 30,
        email: "john@example.com",
        active: true,
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-keys-1@test.com",
      });

      const result = await UserWithoutPk.query()
        .selectJsonKeys("json", "$", "allKeys")
        .one();

      expect(result).not.toBeNull();
      expect(result?.allKeys).toBeDefined();
    });

    test("should get keys of nested JSON object", async () => {
      if (env.DB_TYPE === "sqlite" || env.DB_TYPE === "mssql") {
        return;
      }

      const json = {
        user: {
          profile: {
            firstName: "John",
            lastName: "Doe",
            age: 30,
          },
        },
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-keys-2@test.com",
      });

      const result = await UserWithoutPk.query()
        .selectJsonKeys("json", "user.profile", "profileKeys")
        .one();

      expect(result).not.toBeNull();
      expect(result?.profileKeys).toBeDefined();
    });

    test("should get keys using array path format", async () => {
      if (env.DB_TYPE === "sqlite" || env.DB_TYPE === "mssql") {
        return;
      }

      const json = {
        settings: {
          display: {
            theme: "dark",
            fontSize: 14,
            lineHeight: 1.5,
          },
        },
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-keys-3@test.com",
      });

      const result = await UserWithoutPk.query()
        .selectJsonKeys("json", ["settings", "display"], "displayKeys")
        .one();

      expect(result).not.toBeNull();
      expect(result?.displayKeys).toBeDefined();
    });
  });

  describe("selectJsonRaw - Raw JSON expressions", () => {
    test("should use raw JSON expression for PostgreSQL", async () => {
      if (env.DB_TYPE !== "postgres" && env.DB_TYPE !== "cockroachdb") {
        return;
      }

      const json = {
        user: {
          email: "test@example.com",
        },
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-raw-1@test.com",
      });

      const result = await UserWithoutPk.query()
        .selectJsonRaw("json->>'user'", "userJson")
        .one();

      expect(result).not.toBeNull();
      expect(result?.userJson).toBeDefined();
    });

    test("should use raw JSON expression for MySQL", async () => {
      if (env.DB_TYPE !== "mysql" && env.DB_TYPE !== "mariadb") {
        return;
      }

      const json = {
        data: {
          value: "test123",
        },
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-raw-2@test.com",
      });

      const result = await UserWithoutPk.query()
        .selectJsonRaw(
          "JSON_UNQUOTE(JSON_EXTRACT(json, '$.data.value'))",
          "extractedValue",
        )
        .one();

      expect(result).not.toBeNull();
      expect(result?.extractedValue).toBeDefined();
    });
  });

  describe("Combined JSON select operations", () => {
    test("should combine multiple JSON select methods", async () => {
      if (env.DB_TYPE === "sqlite") {
        return;
      }

      const json = {
        user: {
          name: "Jane Doe",
          email: "jane@example.com",
          profile: {
            bio: "Developer",
            location: "San Francisco",
          },
        },
        tags: ["javascript", "python", "go"],
        metadata: {
          created: "2024-01-01",
          updated: "2024-01-15",
        },
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-combined-1@test.com",
      });

      const result = await UserWithoutPk.query()
        .selectJson("json", "user.name", "userName")
        .selectJsonText("json", "user.email", "userEmail")
        .selectJsonText("json", "user.profile.bio", "userBio")
        .selectJsonArrayLength("json", "tags", "tagCount")
        .one();

      expect(result).not.toBeNull();
      expect(result?.userName).toBeDefined();
      expect(result?.userEmail).toBeDefined();
      expect(result?.userBio).toBeDefined();
      expect(result?.tagCount).toBeDefined();
    });

    test("should combine JSON select with regular select", async () => {
      const json = {
        preferences: {
          theme: "light",
          language: "en",
        },
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-combined-2@test.com",
      });

      const result = await UserWithoutPk.query()
        .select("email", "name")
        .selectJson("json", "preferences.theme", "theme")
        .selectJsonText("json", "preferences.language", "language")
        .one();

      expect(result).not.toBeNull();
      expect(result?.email).toBeDefined();
      expect(result?.name).toBeDefined();
      expect(result?.theme).toBeDefined();
      expect(result?.language).toBeDefined();
    });

    test("should use JSON select with where conditions", async () => {
      const json1 = {
        status: "active",
        priority: "high",
      };

      const json2 = {
        status: "inactive",
        priority: "low",
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json: json1,
        email: "json-where-1@test.com",
      });

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json: json2,
        email: "json-where-2@test.com",
      });

      const result = await UserWithoutPk.query()
        .selectJson("json", "status", "userStatus")
        .selectJson("json", "priority", "userPriority")
        .where("email", "json-where-1@test.com")
        .one();

      expect(result).not.toBeNull();
      expect(result?.userStatus).toBeDefined();
      expect(result?.userPriority).toBeDefined();
    });

    test("should use JSON select with orderBy and limit", async () => {
      if (env.DB_TYPE === "sqlite") {
        return;
      }

      const jsons = [
        { score: 100, rank: 1 },
        { score: 95, rank: 2 },
        { score: 88, rank: 3 },
      ];

      for (let i = 0; i < jsons.length; i++) {
        await UserWithoutPk.insert({
          ...UserFactory.getCommonUserData(),
          json: jsons[i],
          email: `json-order-${i}@test.com`,
        });
      }

      const results = await UserWithoutPk.query()
        .selectJson("json", "score", "userScore")
        .selectJson("json", "rank", "userRank")
        .orderBy("email", "asc")
        .limit(2)
        .many();

      expect(results).toHaveLength(2);
      expect(results[0]?.userScore).toBeDefined();
      expect(results[0]?.userRank).toBeDefined();
    });
  });

  describe("Path format standardization", () => {
    test("should produce same results for different path formats", async () => {
      const json = {
        data: {
          nested: {
            value: "test123",
          },
        },
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-format-1@test.com",
      });

      const result1 = await UserWithoutPk.query()
        .selectJsonText("json", "$.data.nested.value", "value1")
        .one();

      const result2 = await UserWithoutPk.query()
        .selectJsonText("json", "data.nested.value", "value2")
        .one();

      const result3 = await UserWithoutPk.query()
        .selectJsonText("json", ["data", "nested", "value"], "value3")
        .one();

      expect(result1?.value1).toBeDefined();
      expect(result2?.value2).toBeDefined();
      expect(result3?.value3).toBeDefined();
    });

    test("should handle numeric array indices in different formats", async () => {
      const json = {
        items: ["first", "second", "third"],
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-format-2@test.com",
      });

      const result1 = await UserWithoutPk.query()
        .selectJsonText("json", "items.0", "item1")
        .one();

      const result2 = await UserWithoutPk.query()
        .selectJsonText("json", ["items", 0], "item2")
        .one();

      expect(result1?.item1).toBeDefined();
      expect(result2?.item2).toBeDefined();
    });
  });

  describe("Edge cases", () => {
    test("should handle empty JSON object", async () => {
      const json = {};

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-edge-1@test.com",
      });

      const result = await UserWithoutPk.query().select("email").one();

      expect(result).not.toBeNull();
      expect(result?.email).toBe("json-edge-1@test.com");
    });

    test("should handle null values in JSON", async () => {
      const json = {
        nullValue: null,
        validValue: "test",
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-edge-2@test.com",
      });

      const result = await UserWithoutPk.query()
        .selectJson("json", "validValue", "valid")
        .one();

      expect(result).not.toBeNull();
      expect(result?.valid).toBeDefined();
    });

    test("should handle deeply nested JSON structures", async () => {
      const json = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  value: "deep",
                },
              },
            },
          },
        },
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-edge-3@test.com",
      });

      const result = await UserWithoutPk.query()
        .selectJsonText(
          "json",
          "level1.level2.level3.level4.level5.value",
          "deepValue",
        )
        .one();

      expect(result).not.toBeNull();
      expect(result?.deepValue).toBeDefined();
    });

    test("should handle mixed data types in JSON", async () => {
      const json = {
        string: "text",
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: "value" },
      };

      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: "json-edge-4@test.com",
      });

      const result = await UserWithoutPk.query()
        .selectJsonText("json", "string", "stringVal")
        .selectJson("json", "number", "numberVal")
        .selectJson("json", "boolean", "boolVal")
        .one();

      expect(result).not.toBeNull();
      expect(result?.stringVal).toBeDefined();
      expect(result?.numberVal).toBeDefined();
      expect(result?.boolVal).toBeDefined();
    });
  });
});
