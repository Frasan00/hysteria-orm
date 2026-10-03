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
  await sql.startGlobalTransaction();
});

afterEach(async () => {
  await sql.rollbackGlobalTransaction();
});

const insertUser = async (json: Record<string, any>, email: string) =>
  sql.from(UserWithoutPk).insert(
    {
      ...UserFactory.getCommonUserData(),
      json,
      email,
    },
    { returning: ["*"] },
  );

describe(`[${env.DB_TYPE}] Extended JSON Query Operations`, () => {
  describe("whereJsonObject / whereNotJsonObject", () => {
    test("matches an exact object and rejects a partial object", async () => {
      await insertUser({ a: 1, b: 2 }, "obj@json.test");

      const exact = await sql
        .from(UserWithoutPk)
        .whereJsonObject("json", { a: 1, b: 2 })
        .andWhere("email", "obj@json.test")
        .many();
      expect(exact.length).toBe(1);

      const partial = await sql
        .from(UserWithoutPk)
        .whereJsonObject("json", { a: 1 })
        .andWhere("email", "obj@json.test")
        .many();
      expect(partial.length).toBe(0);
    });

    test("whereNotJsonObject matches non-equal objects", async () => {
      await insertUser({ a: 1, b: 2 }, "notobj@json.test");

      const partial = await sql
        .from(UserWithoutPk)
        .whereNotJsonObject("json", { a: 1 })
        .andWhere("email", "notobj@json.test")
        .many();
      expect(partial.length).toBe(1);

      const equal = await sql
        .from(UserWithoutPk)
        .whereNotJsonObject("json", { a: 1, b: 2 })
        .andWhere("email", "notobj@json.test")
        .many();
      expect(equal.length).toBe(0);
    });
  });

  describe("whereJsonPath", () => {
    test("compares the value at a nested path", async () => {
      await insertUser(
        { address: { city: "Rome", zip: "00100" } },
        "path@json.test",
      );

      const match = await sql
        .from(UserWithoutPk)
        .whereJsonPath("json", "address.city", "=", "Rome")
        .andWhere("email", "path@json.test")
        .many();
      expect(match.length).toBe(1);

      const noMatch = await sql
        .from(UserWithoutPk)
        .whereJsonPath("json", "address.city", "=", "Paris")
        .andWhere("email", "path@json.test")
        .many();
      expect(noMatch.length).toBe(0);
    });
  });

  describe("whereJsonSupersetOf / whereJsonSubsetOf", () => {
    test("matches superset and subset relations", async () => {
      if (env.DB_TYPE === "sqlite" || env.DB_TYPE === "mssql") {
        return;
      }

      await insertUser({ a: 1, b: 2 }, "super@json.test");
      await insertUser({ a: 1 }, "sub@json.test");

      const superset = await sql
        .from(UserWithoutPk)
        .whereJsonSupersetOf("json", { a: 1 })
        .andWhere("email", "super@json.test")
        .many();
      expect(superset.length).toBe(1);

      const subset = await sql
        .from(UserWithoutPk)
        .whereJsonSubsetOf("json", { a: 1, b: 2 })
        .andWhere("email", "sub@json.test")
        .many();
      expect(subset.length).toBe(1);

      const notSuperset = await sql
        .from(UserWithoutPk)
        .whereJsonNotSupersetOf("json", { a: 1, b: 2 })
        .andWhere("email", "sub@json.test")
        .many();
      expect(notSuperset.length).toBe(1);
    });
  });

  describe("whereJsonHasNone", () => {
    test("matches rows without any of the keys", async () => {
      if (env.DB_TYPE !== "postgres" && env.DB_TYPE !== "cockroachdb") {
        return;
      }

      await insertUser({ a: 1 }, "hasnone@json.test");

      const none = await sql
        .from(UserWithoutPk)
        .whereJsonHasNone("json", ["b", "c"])
        .andWhere("email", "hasnone@json.test")
        .many();
      expect(none.length).toBe(1);

      const present = await sql
        .from(UserWithoutPk)
        .whereJsonHasNone("json", ["a"])
        .andWhere("email", "hasnone@json.test")
        .many();
      expect(present.length).toBe(0);
    });
  });
});
