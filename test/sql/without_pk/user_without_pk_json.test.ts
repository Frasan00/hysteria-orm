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

describe(`[${env.DB_TYPE}] JSON Query Operations`, () => {
  describe("Basic JSON Filtering", () => {
    test("should query by full JSON object equality using whereJson", async () => {
      const json = { foo: "bar", arr: [1, 2, 3] };
      const user = await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: `eq@json.com`,
      });

      const found = await UserWithoutPk.query().whereJson("json", json).one();
      expect(found).not.toBeNull();
      expect(found?.json).toEqual(json);
    });

    test("should query by nested JSON property using whereJson", async () => {
      const json = { profile: { info: { age: 42 } } };
      const user = await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: `nested@json.com`,
      });

      const found = await UserWithoutPk.query().whereJson("json", json).one();
      expect(found).not.toBeNull();
      expect(found?.json).toEqual(json);
    });

    test("should create and update a user with JSON and retrieve using whereJson", async () => {
      // SQLite doesn't support JSON, MSSQL's CHARINDEX can't do partial JSON matching
      if (env.DB_TYPE === "sqlite" || env.DB_TYPE === "mssql") {
        return;
      }

      const user = await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json: {
          name: "John Doe",
          age: 30,
          a: [{ b: 2 }],
        },
      });

      expect(user.json).toMatchObject({
        name: "John Doe",
        age: 30,
        a: [{ b: 2 }],
      });

      await UserWithoutPk.query().update({
        json: {
          ...user.json,
          a: [{ b: 3 }],
        },
      });

      const retrievedUser = await UserWithoutPk.findOne({
        where: { email: user.email },
      });

      expect(retrievedUser?.json).toMatchObject({
        name: "John Doe",
        age: 30,
        a: [{ b: 3 }],
      });

      const retrievedUserByNestedProperty = await UserWithoutPk.query()
        .whereJson("json", { a: [{ b: 3 }] })
        .one();

      expect(retrievedUserByNestedProperty).not.toBeNull();
    });
  });

  describe("JSON Logical Operations", () => {
    test("should use AND combinations with JSON conditions", async () => {
      // SQLite doesn't support JSON, MSSQL's CHARINDEX can't do partial JSON matching
      if (env.DB_TYPE === "sqlite" || env.DB_TYPE === "mssql") {
        return;
      }

      const jsonA = { logic: "A", status: "active" };
      const jsonB = { logic: "B", status: "active" };
      const userA = await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json: jsonA,
        email: `logicA@json.com`,
      });
      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json: jsonB,
        email: `logicB@json.com`,
      });

      const andFound = await UserWithoutPk.query()
        .whereJson("json", { logic: "A" })
        .andWhereJson("json", { status: "active" })
        .one();

      expect(andFound).not.toBeNull();
      expect(andFound?.email).toBe(userA.email);
    });

    test("should use OR combinations with JSON conditions", async () => {
      const jsonA = { logic: "A" };
      const jsonB = { logic: "B" };
      const userA = await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json: jsonA,
        email: `logicA@json.com`,
      });
      const userB = await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json: jsonB,
        email: `logicB@json.com`,
      });

      const orFound = await UserWithoutPk.query()
        .whereJson("json", jsonA)
        .orWhereJson("json", jsonB)
        .many();

      expect(orFound.map((u) => u.email)).toEqual(
        expect.arrayContaining([userA.email, userB.email]),
      );
    });

    test("should use complex AND/OR combinations with JSON conditions", async () => {
      // SQLite doesn't support JSON, MSSQL's CHARINDEX can't do partial JSON matching
      if (env.DB_TYPE === "sqlite" || env.DB_TYPE === "mssql") {
        return;
      }

      const userA = await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json: { category: "A", priority: 1 },
        email: `complexA@json.com`,
      });
      const userB = await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json: { category: "B", priority: 2 },
        email: `complexB@json.com`,
      });
      const userC = await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json: { category: "A", priority: 2 },
        email: `complexC@json.com`,
      });

      const complexFound = await UserWithoutPk.query()
        .whereJson("json", { category: "A" })
        .orWhereJson("json", { priority: 2 })
        .many();

      expect(complexFound.length).toBeGreaterThanOrEqual(3);
      expect(complexFound.map((u) => u.email)).toEqual(
        expect.arrayContaining([userA.email, userB.email, userC.email]),
      );
    });
  });

  describe("JSON Array and Object Filtering", () => {
    test("should filter by array elements in JSON", async () => {
      // SQLite doesn't support JSON, MSSQL's CHARINDEX can't do partial JSON matching
      if (env.DB_TYPE === "sqlite" || env.DB_TYPE === "mssql") {
        return;
      }

      const userWithArray = await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json: { tags: ["frontend", "typescript"], count: 2 },
        email: `array@json.com`,
      });

      const found = await UserWithoutPk.query()
        .whereJson("json", { tags: ["frontend", "typescript"] })
        .one();

      expect(found).not.toBeNull();
      expect(found?.email).toBe(userWithArray.email);
    });

    test("should filter by nested object properties", async () => {
      // SQLite doesn't support JSON, MSSQL's CHARINDEX can't do partial JSON matching
      if (env.DB_TYPE === "sqlite" || env.DB_TYPE === "mssql") {
        return;
      }

      const userWithNested = await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json: {
          user: { profile: { name: "Alice", settings: { theme: "dark" } } },
        },
        email: `nested@json.com`,
      });

      const found = await UserWithoutPk.query()
        .whereJson("json", {
          user: { profile: { settings: { theme: "dark" } } },
        })
        .one();

      expect(found).not.toBeNull();
      expect(found?.email).toBe(userWithNested.email);
    });
  });

  describe("JSON Data Variations", () => {
    test("should insert and retrieve various JSON structures", async () => {
      const jsonVariants = [
        { foo: "bar", arr: [1, 2, 3], nested: { a: 1 } },
        { simple: "string value" },
        { number: 12345 },
        { bool: true },
        null,
      ];

      for (const json of jsonVariants) {
        const user = await UserWithoutPk.insert({
          ...UserFactory.getCommonUserData(),
          json,
          email: `${Math.random()}@json.com`,
        });
        const retrieved = await UserWithoutPk.findOne({
          where: { email: user.email },
        });
        expect(retrieved?.json).toEqual(json);
      }
    });

    test("should update only part of the JSON object", async () => {
      const json = { a: 1, b: 2 };
      const user = await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: `partial@json.com`,
      });

      await UserWithoutPk.query()
        .where("email", "=", user.email)
        .update({ json: { ...json, b: 3 } });

      const updated = await UserWithoutPk.findOne({
        where: { email: user.email },
      });
      expect(updated?.json).toEqual({ a: 1, b: 3 });
    });
  });

  describe("Bulk JSON Operations", () => {
    test("should bulk insert users with different JSON values and query using whereJson", async () => {
      const users = await UserWithoutPk.insertMany([
        {
          ...UserFactory.getCommonUserData(),
          json: { bulk: 1 },
          email: `bulk1@json.com`,
        },
        {
          ...UserFactory.getCommonUserData(),
          json: { bulk: 2 },
          email: `bulk2@json.com`,
        },
      ]);

      const found1 = await UserWithoutPk.query()
        .whereJson("json", { bulk: 1 })
        .one();
      const found2 = await UserWithoutPk.query()
        .whereJson("json", { bulk: 2 })
        .one();

      expect(found1).not.toBeNull();
      expect(found2).not.toBeNull();
      expect(found1?.email).toBe(users[0].email);
      expect(found2?.email).toBe(users[1].email);
    });

    test("should query multiple JSON conditions with OR", async () => {
      // SQLite doesn't support JSON, MSSQL's CHARINDEX can't do partial JSON matching
      if (env.DB_TYPE === "sqlite" || env.DB_TYPE === "mssql") {
        return;
      }

      const json1 = { bulk: 1, type: "test" };
      const json2 = { bulk: 2, type: "test" };
      const users = await UserWithoutPk.insertMany([
        {
          ...UserFactory.getCommonUserData(),
          json: json1,
          email: `bulkOr1@json.com`,
        },
        {
          ...UserFactory.getCommonUserData(),
          json: json2,
          email: `bulkOr2@json.com`,
        },
      ]);

      const foundByOr = await UserWithoutPk.query()
        .whereJson("json", { bulk: 1 })
        .orWhereJson("json", { bulk: 2 })
        .many();

      expect(foundByOr.length).toBeGreaterThanOrEqual(2);
      expect(foundByOr.map((u) => u.email)).toEqual(
        expect.arrayContaining([users[0].email, users[1].email]),
      );
    });
  });

  describe("Advanced JSON Query Filters", () => {
    test("should filter using whereJsonContains and whereJsonNotContains", async () => {
      // SQLite doesn't support JSON, MSSQL's CHARINDEX can't do partial JSON matching
      if (env.DB_TYPE === "sqlite" || env.DB_TYPE === "mssql") {
        return;
      }

      const jsonA = { arr: [1, 2, 3], foo: "bar" };
      const jsonB = { arr: [4, 5, 6], foo: "baz" };
      const userA = await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json: jsonA,
        email: `containsA@json.com`,
      });
      const userB = await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json: jsonB,
        email: `containsB@json.com`,
      });
      // whereJsonContains
      const foundA = await UserWithoutPk.query()
        .whereJsonContains("json", { arr: [1, 2, 3] })
        .one();
      expect(foundA).not.toBeNull();
      expect(foundA?.email).toBe(userA.email);
      // whereJsonNotContains
      const notFoundA = await UserWithoutPk.query()
        .whereJsonNotContains("json", { arr: [1, 2, 3] })
        .one();
      expect(notFoundA).not.toBeNull();
      expect(notFoundA?.email).not.toBe(userA.email);
    });

    test("should filter using whereNotJson", async () => {
      const jsonA = { foo: "bar" };
      const jsonB = { foo: "baz" };
      await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json: jsonA,
        email: `notjsonA@json.com`,
      });
      const userB = await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json: jsonB,
        email: `notjsonB@json.com`,
      });
      const found = await UserWithoutPk.query()
        .whereNotJson("json", { foo: "bar" })
        .one();
      expect(found).not.toBeNull();
      expect(found?.json).not.toBeNull();
      expect(found?.json && found?.json.foo).toBe("baz");
    });
  });

  describe("Selecting JSON Column", () => {
    test("should select only the JSON column", async () => {
      const json = { foo: "bar", arr: [1, 2, 3] };
      const user = await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: `selectjson@json.com`,
      });
      const found = await UserWithoutPk.query()
        .select("json")
        .where("email", "=", user.email)
        .one();
      expect(found).not.toBeNull();
      expect(found?.json).toEqual(json);
      // Should not have other columns (except maybe id/pk if present)
      expect(Object.keys(found ?? {})).toContain("json");
    });

    test("should select JSON column and another column", async () => {
      const json = { foo: "baz" };
      const user = await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json,
        email: `selectjson2@json.com`,
      });
      const found = await UserWithoutPk.query()
        .select("json", "email")
        .where("email", "=", user.email)
        .one();
      expect(found).not.toBeNull();
      expect(found?.json).toEqual(json);
      expect(found?.email).toBe(user.email);
    });

    test("should select JSON column when it is null", async () => {
      const user = await UserWithoutPk.insert({
        ...UserFactory.getCommonUserData(),
        json: null,
        email: `selectjsonnull@json.com`,
      });
      const found = await UserWithoutPk.query()
        .select("json")
        .where("email", "=", user.email)
        .one();
      expect(found).not.toBeNull();
      expect(found?.json).toBeNull();
    });
  });
});
