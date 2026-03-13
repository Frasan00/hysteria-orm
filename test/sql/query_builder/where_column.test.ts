import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
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

describe(`[${env.DB_TYPE}] QueryBuilder whereColumn`, () => {
  beforeEach(async () => {
    await sql.query("users_without_pk").delete();
    await sql.query("users_without_pk").insertMany([
      {
        name: "Alice",
        email: "alice@wc.test",
        age: 30,
        salary: 50,
        height: 170,
        weight: 60,
      },
      {
        name: "Bob",
        email: "bob@wc.test",
        age: 25,
        salary: 20,
        height: 180,
        weight: 80,
      },
      {
        name: "Charlie",
        email: "charlie@wc.test",
        age: 40,
        salary: 40,
        height: 160,
        weight: 70,
      },
    ]);
  });

  afterEach(async () => {
    await sql.query("users_without_pk").delete();
  });

  test("whereColumn with 2 args defaults to equality", async () => {
    const results = await sql
      .query("users_without_pk")
      .whereColumn("age", "salary")
      .many();

    expect(results.length).toBe(1);
    expect(results[0].name).toBe("Charlie");
  });

  test("whereColumn with 3 args uses custom operator", async () => {
    const results = await sql
      .query("users_without_pk")
      .whereColumn("age", ">", "salary")
      .many();

    expect(results.length).toBe(1);
    expect(results[0].name).toBe("Bob");
  });

  test("andWhereColumn chains with AND", async () => {
    const results = await sql
      .query("users_without_pk")
      .where("age", ">", 20)
      .andWhereColumn("age", ">=", "salary")
      .many();

    expect(results.length).toBe(2);
    const names = results.map((r: any) => r.name).sort();
    expect(names).toEqual(["Bob", "Charlie"]);
  });

  test("orWhereColumn chains with OR", async () => {
    const results = await sql
      .query("users_without_pk")
      .where("name", "Alice")
      .orWhereColumn("age", "salary")
      .many();

    expect(results.length).toBe(2);
    const names = results.map((r: any) => r.name).sort();
    expect(names).toEqual(["Alice", "Charlie"]);
  });

  test("whereColumn with table-qualified columns", async () => {
    const results = await sql
      .query("users_without_pk")
      .whereColumn("users_without_pk.age", "users_without_pk.salary")
      .many();

    expect(results.length).toBe(1);
    expect(results[0].name).toBe("Charlie");
  });

  test("whereColumn with 3 args and table-qualified columns", async () => {
    const results = await sql
      .query("users_without_pk")
      .whereColumn("users_without_pk.age", "<", "users_without_pk.salary")
      .many();

    expect(results.length).toBe(1);
    expect(results[0].name).toBe("Alice");
  });

  test("toQuery generates correct SQL with whereColumn", async () => {
    const query = sql
      .query("users_without_pk")
      .whereColumn("age", ">", "salary")
      .toQuery();

    expect(query.toLowerCase()).toContain("where");
    expect(query.toLowerCase()).toContain("age");
    expect(query.toLowerCase()).toContain("salary");
    expect(query).toContain(">");
  });
});

describe(`[${env.DB_TYPE}] ModelQueryBuilder whereColumn`, () => {
  beforeEach(async () => {
    await sql.query("users_without_pk").delete();
    await sql.from(UserWithoutPk).insertMany([
      {
        name: "Alice",
        email: "alice@wc.test",
        age: 30,
        salary: 50,
        height: 170,
        weight: 60,
      },
      {
        name: "Bob",
        email: "bob@wc.test",
        age: 25,
        salary: 20,
        height: 180,
        weight: 80,
      },
      {
        name: "Charlie",
        email: "charlie@wc.test",
        age: 40,
        salary: 40,
        height: 160,
        weight: 70,
      },
    ]);
  });

  afterEach(async () => {
    await sql.query("users_without_pk").delete();
  });

  test("whereColumn with 2 args defaults to equality", async () => {
    const results = await sql
      .from(UserWithoutPk)
      .whereColumn("age", "salary")
      .many({ ignoreHooks: ["beforeFetch"] });

    expect(results.length).toBe(1);
    expect(results[0].name).toBe("Charlie");
  });

  test("whereColumn with 3 args uses custom operator", async () => {
    const results = await sql
      .from(UserWithoutPk)
      .whereColumn("age", ">", "salary")
      .many({ ignoreHooks: ["beforeFetch"] });

    expect(results.length).toBe(1);
    expect(results[0].name).toBe("Bob");
  });

  test("andWhereColumn chains with AND", async () => {
    const results = await sql
      .from(UserWithoutPk)
      .where("age", ">", 20)
      .andWhereColumn("age", ">=", "salary")
      .many({ ignoreHooks: ["beforeFetch"] });

    expect(results.length).toBe(2);
    const names = results.map((r) => r.name).sort();
    expect(names).toEqual(["Bob", "Charlie"]);
  });

  test("orWhereColumn chains with OR", async () => {
    const results = await sql
      .from(UserWithoutPk)
      .where("name", "Alice")
      .orWhereColumn("age", "salary")
      .many({ ignoreHooks: ["beforeFetch"] });

    expect(results.length).toBe(2);
    const names = results.map((r) => r.name).sort();
    expect(names).toEqual(["Alice", "Charlie"]);
  });

  test("toQuery generates correct SQL with whereColumn", async () => {
    const query = sql
      .from(UserWithoutPk)
      .whereColumn("age", ">", "salary")
      .toQuery();

    expect(query.toLowerCase()).toContain("where");
    expect(query.toLowerCase()).toContain("age");
    expect(query.toLowerCase()).toContain("salary");
    expect(query).toContain(">");
  });
});
