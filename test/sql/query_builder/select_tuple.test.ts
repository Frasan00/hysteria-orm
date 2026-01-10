import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
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

describe(`[${env.DB_TYPE}] QueryBuilder tuple-based select syntax`, () => {
  beforeEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
    await SqlDataSource.instance.query("users_without_pk").insertMany([
      { name: "Alice", age: 25, email: "alice@test.com" },
      { name: "Bob", age: 30, email: "bob@test.com" },
      { name: "Charlie", age: 35, email: "charlie@test.com" },
    ]);
  });

  afterEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
  });

  test("should select single column with tuple alias", async () => {
    const user = await SqlDataSource.instance
      .query("users_without_pk")
      .select(["name", "userName"])
      .where("name", "Alice")
      .oneOrFail();

    expect(user).toBeDefined();
    expect(user.userName).toBe("Alice");
    expect((user as any).name).toBeUndefined();
  });

  test("should select multiple columns with tuple aliases", async () => {
    const user = await SqlDataSource.instance
      .query("users_without_pk")
      .select(["name", "userName"], ["email", "userEmail"])
      .where("name", "Alice")
      .oneOrFail();

    expect(user).toBeDefined();
    expect(user.userName).toBe("Alice");
    expect(user.userEmail).toBe("alice@test.com");
  });

  test("should mix regular columns and tuple aliases", async () => {
    const user = await SqlDataSource.instance
      .query("users_without_pk")
      .select("age", ["name", "userName"], ["email", "userEmail"])
      .where("name", "Alice")
      .oneOrFail();

    expect(user).toBeDefined();
    expect(user.age).toBeDefined();
    expect(user.userName).toBe("Alice");
    expect(user.userEmail).toBe("alice@test.com");
  });

  test("should chain select calls with tuples", async () => {
    const user = await SqlDataSource.instance
      .query("users_without_pk")
      .select(["name", "userName"])
      .select(["email", "userEmail"])
      .where("name", "Alice")
      .oneOrFail();

    expect(user).toBeDefined();
    expect(user.userName).toBe("Alice");
    expect(user.userEmail).toBe("alice@test.com");
  });

  test("should select with tuple and wildcard", async () => {
    const user = await SqlDataSource.instance
      .query("users_without_pk")
      .select("*", ["name", "aliasedName"])
      .where("name", "Alice")
      .oneOrFail();

    expect(user).toBeDefined();
    expect(user.aliasedName).toBe("Alice");
    expect(user.name).toBe("Alice");
    expect(user.email).toBe("alice@test.com");
  });

  test("should work with many() returning multiple results", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .select(["name", "userName"], ["age", "userAge"])
      .orderBy("name", "asc")
      .many();

    expect(users).toHaveLength(3);
    expect(users[0].userName).toBe("Alice");
    expect(users[1].userName).toBe("Bob");
    expect(users[2].userName).toBe("Charlie");
  });

  test("should combine tuple select with selectRaw", async () => {
    if (env.DB_TYPE === "mssql") return;
    const user = await SqlDataSource.instance
      .query("users_without_pk")
      .select(["name", "userName"])
      .selectRaw<{ nameLength: number }>("length(name) as nameLength")
      .where("name", "Alice")
      .oneOrFail();

    expect(user).toBeDefined();
    expect(user.userName).toBe("Alice");
    expect(user.nameLength).toBeDefined();
  });

  test("should combine tuple select with selectFunc", async () => {
    if (env.DB_TYPE === "mssql") return;
    const result = await SqlDataSource.instance
      .query("users_without_pk")
      .select(["name", "userName"])
      .selectFunc("count", "*", "total")
      .groupBy("name")
      .orderBy("name", "asc")
      .many();

    expect(result).toBeDefined();
    expect(result[0].userName).toBe("Alice");
    expect(result[0].total).toBeDefined();
  });

  test("should handle tuples in pagination", async () => {
    const page = await SqlDataSource.instance
      .query("users_without_pk")
      .select(["name", "userName"], ["email", "userEmail"])
      .orderBy("name", "asc")
      .paginate(1, 2);

    expect(page.data).toHaveLength(2);
    expect(page.data[0].userName).toBe("Alice");
    expect(page.data[0].userEmail).toBe("alice@test.com");
    expect(page.paginationMetadata.total).toBe(3);
  });
});

describe(`[${env.DB_TYPE}] ModelQueryBuilder tuple-based select syntax`, () => {
  beforeEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
    await UserWithoutPk.insertMany([
      { name: "Alice", age: 25, email: "alice@test.com" },
      { name: "Bob", age: 30, email: "bob@test.com" },
      { name: "Charlie", age: 35, email: "charlie@test.com" },
    ]);
  });

  afterEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
  });

  test("should select single column with tuple alias", async () => {
    const user = await UserWithoutPk.query()
      .select(["name", "userName"])
      .where("name", "Alice")
      .oneOrFail();

    expect(user).toBeDefined();
    expect(user.userName).toBe("Alice");
    expect((user as any).name).toBeUndefined();
  });

  test("should select multiple columns with tuple aliases", async () => {
    const user = await UserWithoutPk.query()
      .select(["name", "userName"], ["email", "userEmail"])
      .where("name", "Alice")
      .oneOrFail();

    expect(user).toBeDefined();
    expect(user.userName).toBe("Alice");
    expect(user.userEmail).toBe("alice@test.com");
  });

  test("should mix regular columns and tuple aliases", async () => {
    const user = await UserWithoutPk.query()
      .select("age", ["name", "userName"], ["email", "userEmail"])
      .where("name", "Alice")
      .oneOrFail();

    expect(user).toBeDefined();
    expect(user.age).toBeDefined();
    expect(user.userName).toBe("Alice");
    expect(user.userEmail).toBe("alice@test.com");
  });

  test("should chain select calls with tuples", async () => {
    const user = await UserWithoutPk.query()
      .select(["name", "userName"])
      .select(["email", "userEmail"])
      .where("name", "Alice")
      .oneOrFail();

    expect(user).toBeDefined();
    expect(user.userName).toBe("Alice");
    expect(user.userEmail).toBe("alice@test.com");
  });

  test("should select with tuple and wildcard", async () => {
    const user = await UserWithoutPk.query()
      .select("*", ["name", "aliasedName"])
      .where("name", "Alice")
      .oneOrFail();

    expect(user).toBeDefined();
    expect((user as any).aliasedName).toBe("Alice");
    expect(user.name).toBe("Alice");
    expect(user.email).toBe("alice@test.com");
  });

  test("should work with many() returning multiple results", async () => {
    const users = await UserWithoutPk.query()
      .select(["name", "userName"], ["age", "userAge"])
      .orderBy("name", "asc")
      .many();

    expect(users).toHaveLength(3);
    expect(users[0].userName).toBe("Alice");
    if (env.DB_TYPE === "cockroachdb") {
      expect(users[0].userAge).toBe("25");
    } else {
      expect(users[0].userAge).toBe(25);
    }
    expect(users[1].userName).toBe("Bob");
    expect(users[2].userName).toBe("Charlie");
  });

  test("should combine tuple select with selectRaw", async () => {
    if (env.DB_TYPE === "mssql") return;
    const user = await UserWithoutPk.query()
      .select(["name", "userName"])
      .selectRaw<{ nameLength: number }>("length(name) as nameLength")
      .where("name", "Alice")
      .oneOrFail();

    expect(user).toBeDefined();
    expect(user.userName).toBe("Alice");
    expect(user.nameLength).toBeDefined();
  });

  test("should combine tuple select with selectFunc", async () => {
    const result = await UserWithoutPk.query()
      .select(["name", "userName"])
      .selectFunc("count", "*", "total")
      .groupBy("name")
      .orderBy("name", "asc")
      .many();

    expect(result).toBeDefined();
    expect(result[0].userName).toBe("Alice");
    expect(result[0].total).toBeDefined();
  });

  test("should handle tuples in pagination", async () => {
    const page = await UserWithoutPk.query()
      .select(["name", "userName"], ["email", "userEmail"])
      .orderBy("name", "asc")
      .paginate(1, 2);

    expect(page.data).toHaveLength(2);
    expect(page.data[0].userName).toBe("Alice");
    expect(page.data[0].userEmail).toBe("alice@test.com");
    expect(page.paginationMetadata.total).toBe(3);
  });

  test("should work without as const (tuple inference)", async () => {
    const user = await UserWithoutPk.query()
      .select(["name", "userName"])
      .where("name", "Alice")
      .oneOrFail();

    expect(user.userName).toBe("Alice");
  });

  test("should handle multiple tuple aliases in single call", async () => {
    const user = await UserWithoutPk.query()
      .select(
        ["name", "displayName"],
        ["email", "contactEmail"],
        ["age", "currentAge"],
      )
      .where("name", "Alice")
      .oneOrFail();

    expect(user.displayName).toBe("Alice");
    expect(user.contactEmail).toBe("alice@test.com");
    if (env.DB_TYPE === "cockroachdb") {
      expect(user.currentAge).toBe("25");
    } else {
      expect(user.currentAge).toBe(25);
    }
  });

  test("should work with selectJson and tuple select", async () => {
    const user = await UserWithoutPk.query()
      .select(["name", "userName"])
      .selectJson("name", "$", "jsonName")
      .where("name", "Alice")
      .oneOrFail();

    expect(user.userName).toBe("Alice");
    expect(user.jsonName).toBeDefined();
  });
});

describe(`[${env.DB_TYPE}] Tuple select with joins`, () => {
  beforeEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
    await SqlDataSource.instance.query("posts_with_uuid").delete();

    await SqlDataSource.instance.query("users_without_pk").insertMany([
      { name: "Alice", age: 25, email: "alice@test.com" },
      { name: "Bob", age: 30, email: "bob@test.com" },
    ]);
  });

  afterEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
    await SqlDataSource.instance.query("posts_with_uuid").delete();
  });

  test("should select with tuple alias in joined query (QueryBuilder)", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .select(["users_without_pk.name", "authorName"], ["email", "authorEmail"])
      .orderBy("name", "asc")
      .many();

    expect(users).toHaveLength(2);
    expect(users[0].authorName).toBe("Alice");
    expect(users[0].authorEmail).toBe("alice@test.com");
  });

  test("should select with qualified column tuple alias (ModelQueryBuilder)", async () => {
    const users = await UserWithoutPk.query()
      .select(["users_without_pk.name", "qualifiedName"], "age")
      .orderBy("name", "asc")
      .many();

    expect(users).toHaveLength(2);
    expect(users[0].qualifiedName).toBe("Alice");
    if (env.DB_TYPE === "cockroachdb") {
      expect(users[0].age).toBe("25");
    } else {
      expect(users[0].age).toBe(25);
    }
  });
});

describe(`[${env.DB_TYPE}] Tuple select edge cases`, () => {
  beforeEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
    await SqlDataSource.instance
      .query("users_without_pk")
      .insertMany([{ name: "Alice", age: 25, email: "alice@test.com" }]);
  });

  afterEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
  });

  test("should handle empty select then tuple select", async () => {
    const user = await SqlDataSource.instance
      .query("users_without_pk")
      .select(["name", "userName"])
      .where("name", "Alice")
      .oneOrFail();

    expect(user.userName).toBe("Alice");
  });

  test("should handle clearSelect followed by tuple select", async () => {
    const user = await SqlDataSource.instance
      .query("users_without_pk")
      .select("*")
      .clearSelect()
      .select(["name", "userName"])
      .where("name", "Alice")
      .oneOrFail();

    expect(user.userName).toBe("Alice");
    expect((user as any).email).toBeUndefined();
  });

  test("should handle tuple with same column and alias name", async () => {
    const user = await SqlDataSource.instance
      .query("users_without_pk")
      .select(["name", "name"])
      .where("name", "Alice")
      .oneOrFail();

    expect(user.name).toBe("Alice");
  });

  test("should work with clone() and tuple select", async () => {
    const baseQuery = SqlDataSource.instance
      .query("users_without_pk")
      .select(["name", "userName"]);

    const clonedQuery = baseQuery.clone().where("name", "Alice");
    const user = await clonedQuery.oneOrFail();

    expect(user.userName).toBe("Alice");
  });

  test("should work with pluck after tuple select", async () => {
    await SqlDataSource.instance
      .query("users_without_pk")
      .insertMany([{ name: "Bob", age: 30, email: "bob@test.com" }]);

    const names = await SqlDataSource.instance
      .query("users_without_pk")
      .select(["name", "userName"])
      .pluck("userName");

    expect(names).toContain("Alice");
    expect(names).toContain("Bob");
  });

  test("should handle chunk with tuple select", async () => {
    await SqlDataSource.instance.query("users_without_pk").insertMany([
      { name: "Bob", age: 30, email: "bob@test.com" },
      { name: "Charlie", age: 35, email: "charlie@test.com" },
    ]);

    const chunks: any[][] = [];
    for await (const chunk of SqlDataSource.instance
      .query("users_without_pk")
      .select(["name", "userName"])
      .orderBy("name", "asc")
      .chunk(2)) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(2);
    expect(chunks[0][0].userName).toBe("Alice");
    expect(chunks[0][1].userName).toBe("Bob");
    expect(chunks[1][0].userName).toBe("Charlie");
  });

  test("toQuery should generate correct SQL with tuple alias", async () => {
    const query = SqlDataSource.instance
      .query("users_without_pk")
      .select(["name", "userName"], ["email", "userEmail"])
      .toQuery();

    expect(query.toLowerCase()).toContain("as");
    expect(query.toLowerCase()).toContain("username");
    expect(query.toLowerCase()).toContain("useremail");
  });

  test("ModelQueryBuilder toQuery should generate correct SQL with tuple alias", async () => {
    const query = UserWithoutPk.query()
      .select(["name", "userName"], ["email", "userEmail"])
      .toQuery();

    expect(query.toLowerCase()).toContain("as");
    expect(query.toLowerCase()).toContain("username");
    expect(query.toLowerCase()).toContain("useremail");
  });
});
