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

describe(`[${env.DB_TYPE}] QueryBuilder select with subquery`, () => {
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

  test("should select with callback subquery", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .select("name")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{
            olderOrEqualCount: number;
          }>("COUNT(*) as olderOrEqualCount")
          .from("users_without_pk as u2")
          .whereRaw("u2.age >= users_without_pk.age");
      }, "olderOrEqualCount")
      .orderBy("name", "asc")
      .many();

    expect(users).toHaveLength(3);
    expect(users[0].name).toBe("Alice");
    expect(users[0].olderOrEqualCount).toBeDefined();
    expect(users[2].name).toBe("Charlie");
  });

  test("should select with QueryBuilder instance subquery", async () => {
    const subQuery = SqlDataSource.instance
      .query("users_without_pk")
      .selectRaw<{ olderOrEqualCount: number }>("COUNT(*) as olderOrEqualCount")
      .from("users_without_pk as u2")
      .whereRaw("u2.age >= users_without_pk.age");

    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .select("name")
      .select<number>(subQuery, "olderOrEqualCount")
      .orderBy("name", "asc")
      .many();

    expect(users).toHaveLength(3);
    expect(users[0].name).toBe("Alice");
    expect(users[0].olderOrEqualCount).toBeDefined();
  });

  test("should chain multiple subquery selects", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .select("name", "age")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ olderCount: number }>("COUNT(*) as olderCount")
          .from("users_without_pk as u2")
          .whereRaw("u2.age > users_without_pk.age");
      }, "olderCount")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ youngerCount: number }>("COUNT(*) as youngerCount")
          .from("users_without_pk as u2")
          .whereRaw("u2.age < users_without_pk.age");
      }, "youngerCount")
      .where("name", "Bob")
      .oneOrFail();

    expect(users.name).toBe("Bob");
    expect(Number(users.age)).toBe(30);
    expect(users.olderCount).toBeDefined();
    expect(users.youngerCount).toBeDefined();
  });

  test("should work with subquery and regular columns", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .select("name", "email")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ maxAge: number }>("MAX(age) as maxAge")
          .from("users_without_pk");
      }, "maxAge")
      .where("name", "Alice")
      .oneOrFail();

    expect(users.name).toBe("Alice");
    expect(users.email).toBe("alice@test.com");
    expect(Number(users.maxAge)).toBe(35);
  });

  test("should work with subquery and selectRaw", async () => {
    if (env.DB_TYPE === "mssql") return;

    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .select("name")
      .selectRaw<{ nameLength: number }>("length(name) as nameLength")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ totalUsers: number }>("COUNT(*) as totalUsers")
          .from("users_without_pk");
      }, "totalUsers")
      .where("name", "Alice")
      .oneOrFail();

    expect(users.name).toBe("Alice");
    expect(users.nameLength).toBeDefined();
    expect(Number(users.totalUsers)).toBe(3);
  });

  test("should work with subquery and selectFunc", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .select("name")
      .selectFunc("upper", "name", "upperName")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ avgAge: number }>("AVG(age) as avgAge")
          .from("users_without_pk");
      }, "avgAge")
      .where("name", "Bob")
      .oneOrFail();

    expect(users.name).toBe("Bob");
    expect(users.upperName).toBe("BOB");
    expect(users.avgAge).toBeDefined();
  });

  test("should handle subquery in pagination", async () => {
    const page = await SqlDataSource.instance
      .query("users_without_pk")
      .select("name")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ totalCount: number }>("COUNT(*) as totalCount")
          .from("users_without_pk");
      }, "totalCount")
      .orderBy("name", "asc")
      .paginate(1, 2);

    expect(page.data).toHaveLength(2);
    expect(page.data[0].name).toBe("Alice");
    expect(Number(page.data[0].totalCount)).toBe(3);
    expect(page.paginationMetadata.total).toBe(3);
  });

  test("should handle subquery with pluck", async () => {
    const names = await SqlDataSource.instance
      .query("users_without_pk")
      .select("name")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ totalCount: number }>("COUNT(*) as totalCount")
          .from("users_without_pk");
      }, "totalCount")
      .pluck("name");

    expect(names).toContain("Alice");
    expect(names).toContain("Bob");
    expect(names).toContain("Charlie");
  });

  test("should handle subquery with chunk", async () => {
    const chunks: any[][] = [];
    for await (const chunk of SqlDataSource.instance
      .query("users_without_pk")
      .select("name")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ maxAge: number }>("MAX(age) as maxAge")
          .from("users_without_pk");
      }, "maxAge")
      .orderBy("name", "asc")
      .chunk(2)) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(2);
    expect(chunks[0][0].name).toBe("Alice");
    expect(Number(chunks[0][0].maxAge)).toBe(35);
    expect(chunks[1][0].name).toBe("Charlie");
  });

  test("should work with clearSelect and subquery", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .select("*")
      .clearSelect()
      .select("name")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ totalUsers: number }>("COUNT(*) as totalUsers")
          .from("users_without_pk");
      }, "totalUsers")
      .where("name", "Alice")
      .oneOrFail();

    expect(users.name).toBe("Alice");
    expect((users as any).email).toBeUndefined();
    expect(Number(users.totalUsers)).toBe(3);
  });

  test("toQuery should generate correct SQL with subquery", async () => {
    const query = SqlDataSource.instance
      .query("users_without_pk")
      .select("name")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ totalCount: number }>("COUNT(*) as totalCount")
          .from("users_without_pk as u2");
      }, "totalCount")
      .toQuery();

    expect(query.toLowerCase()).toContain("select");
    expect(query.toLowerCase()).toContain("totalcount");
  });
});

describe(`[${env.DB_TYPE}] ModelQueryBuilder select with subquery`, () => {
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

  test("should select with callback subquery", async () => {
    const users = await UserWithoutPk.query()
      .select("name")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{
            olderOrEqualCount: number;
          }>("COUNT(*) as olderOrEqualCount")
          .from("users_without_pk as u2")
          .whereRaw("u2.age >= users_without_pk.age");
      }, "olderOrEqualCount")
      .orderBy("name", "asc")
      .many();

    expect(users).toHaveLength(3);
    expect(users[0].name).toBe("Alice");
    expect(users[0].olderOrEqualCount).toBeDefined();
    expect(users[2].name).toBe("Charlie");
  });

  test("should select with QueryBuilder instance subquery", async () => {
    const subQuery = SqlDataSource.instance
      .query("users_without_pk")
      .selectRaw<{ olderOrEqualCount: number }>("COUNT(*) as olderOrEqualCount")
      .from("users_without_pk as u2")
      .whereRaw("u2.age >= users_without_pk.age");

    const users = await UserWithoutPk.query()
      .select("name")
      .select<number>(subQuery, "olderOrEqualCount")
      .orderBy("name", "asc")
      .many();

    expect(users).toHaveLength(3);
    expect(users[0].name).toBe("Alice");
    expect(users[0].olderOrEqualCount).toBeDefined();
  });

  test("should chain multiple subquery selects", async () => {
    const users = await UserWithoutPk.query()
      .select("name", "age")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ olderCount: number }>("COUNT(*) as olderCount")
          .from("users_without_pk as u2")
          .whereRaw("u2.age > users_without_pk.age");
      }, "olderCount")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ youngerCount: number }>("COUNT(*) as youngerCount")
          .from("users_without_pk as u2")
          .whereRaw("u2.age < users_without_pk.age");
      }, "youngerCount")
      .where("name", "Bob")
      .oneOrFail();

    expect(users.name).toBe("Bob");
    if (env.DB_TYPE === "cockroachdb") {
      expect(users.age).toBe("30");
    } else {
      expect(users.age).toBe(30);
    }
    expect(users.olderCount).toBeDefined();
    expect(users.youngerCount).toBeDefined();
  });

  test("should work with subquery and regular columns", async () => {
    const users = await UserWithoutPk.query()
      .select("name", "email")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ maxAge: number }>("MAX(age) as maxAge")
          .from("users_without_pk")
          .from("users_without_pk");
      }, "maxAge")
      .where("name", "Alice")
      .oneOrFail();

    expect(users.name).toBe("Alice");
    expect(users.email).toBe("alice@test.com");
    if (env.DB_TYPE === "cockroachdb") {
      expect(users.maxAge).toBe("35");
    } else {
      expect(users.maxAge).toBe(35);
    }
  });

  test("should work with subquery and selectRaw", async () => {
    if (env.DB_TYPE === "mssql") return;

    const users = await UserWithoutPk.query()
      .select("name")
      .selectRaw<{ nameLength: number }>("length(name) as nameLength")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ totalUsers: number }>("COUNT(*) as totalUsers")
          .from("users_without_pk")
          .from("users_without_pk");
      }, "totalUsers")
      .where("name", "Alice")
      .oneOrFail();

    expect(users.name).toBe("Alice");
    expect(users.nameLength).toBeDefined();
    expect(Number(users.totalUsers)).toBe(3);
  });

  test("should work with subquery and selectFunc", async () => {
    const users = await UserWithoutPk.query()
      .select("name")
      .selectFunc("upper", "name", "upperName")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ avgAge: number }>("AVG(age) as avgAge")
          .from("users_without_pk");
      }, "avgAge")
      .where("name", "Bob")
      .oneOrFail();

    expect(users.name).toBe("Bob");
    expect(users.upperName).toBe("BOB");
    expect(users.avgAge).toBeDefined();
  });

  test("should handle subquery in pagination", async () => {
    const page = await UserWithoutPk.query()
      .select("name")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ totalCount: number }>("COUNT(*) as totalCount")
          .from("users_without_pk");
      }, "totalCount")
      .orderBy("name", "asc")
      .paginate(1, 2);

    expect(page.data).toHaveLength(2);
    expect(page.data[0].name).toBe("Alice");
    expect(Number(page.data[0].totalCount)).toBe(3);
    expect(page.paginationMetadata.total).toBe(3);
  });

  test("should handle subquery with pluck", async () => {
    const names = await UserWithoutPk.query()
      .select("name")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ totalCount: number }>("COUNT(*) as totalCount")
          .from("users_without_pk");
      }, "totalCount")
      .pluck("name");

    expect(names).toContain("Alice");
    expect(names).toContain("Bob");
    expect(names).toContain("Charlie");
  });

  test("should handle subquery with chunk", async () => {
    const chunks: any[][] = [];
    for await (const chunk of UserWithoutPk.query()
      .select("name")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ maxAge: number }>("MAX(age) as maxAge")
          .from("users_without_pk");
      }, "maxAge")
      .orderBy("name", "asc")
      .chunk(2)) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(2);
    expect(chunks[0][0].name).toBe("Alice");
    if (env.DB_TYPE === "cockroachdb") {
      expect(chunks[0][0].maxAge).toBe("35");
    } else {
      expect(chunks[0][0].maxAge).toBe(35);
    }
    expect(chunks[1][0].name).toBe("Charlie");
  });

  test("should work with clearSelect and subquery", async () => {
    const users = await UserWithoutPk.query()
      .select("*")
      .clearSelect()
      .select("name")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ totalUsers: number }>("COUNT(*) as totalUsers")
          .from("users_without_pk");
      }, "totalUsers")
      .where("name", "Alice")
      .oneOrFail();

    expect(users.name).toBe("Alice");
    expect((users as any).email).toBeUndefined();
    expect(Number(users.totalUsers)).toBe(3);
  });

  test("should work with clone and subquery", async () => {
    const baseQuery = UserWithoutPk.query()
      .select("name")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ totalCount: number }>("COUNT(*) as totalCount")
          .from("users_without_pk");
      }, "totalCount");

    const clonedQuery = baseQuery.clone().where("name", "Alice");
    const user = await clonedQuery.oneOrFail();

    expect(user.name).toBe("Alice");
    expect(Number(user.totalCount)).toBe(3);
  });

  test("should work with selectJson and subquery select", async () => {
    const user = await UserWithoutPk.query()
      .select("name")
      .selectJson("name", "$", "jsonName")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ totalCount: number }>("COUNT(*) as totalCount")
          .from("users_without_pk");
      }, "totalCount")
      .where("name", "Alice")
      .oneOrFail();

    expect(user.name).toBe("Alice");
    expect(user.jsonName).toBeDefined();
    expect(Number(user.totalCount)).toBe(3);
  });

  test("toQuery should generate correct SQL with subquery", async () => {
    const query = UserWithoutPk.query()
      .select("name")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ totalCount: number }>("COUNT(*) as totalCount")
          .from("users_without_pk as u2");
      }, "totalCount")
      .toQuery();

    expect(query.toLowerCase()).toContain("select");
    expect(query.toLowerCase()).toContain("totalcount");
  });

  test("should work with correlated subquery", async () => {
    const users = await UserWithoutPk.query()
      .select("name", "age")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ selfCount: number }>("COUNT(*) as selfCount")
          .from("users_without_pk as u2")
          .whereRaw("u2.name = users_without_pk.name");
      }, "selfCount")
      .orderBy("name", "asc")
      .many();

    expect(users).toHaveLength(3);
    expect(Number(users[0].selfCount)).toBe(1);
    expect(Number(users[1].selfCount)).toBe(1);
    expect(Number(users[2].selfCount)).toBe(1);
  });
});

describe(`[${env.DB_TYPE}] Select subquery edge cases`, () => {
  beforeEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
    await SqlDataSource.instance
      .query("users_without_pk")
      .insertMany([{ name: "Alice", age: 25, email: "alice@test.com" }]);
  });

  afterEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
  });

  test("should handle complex subquery with multiple conditions", async () => {
    const user = await SqlDataSource.instance
      .query("users_without_pk")
      .select("name")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ ageRangeCount: number }>("COUNT(*) as ageRangeCount")
          .from("users_without_pk as u2")
          .where("u2.age", ">", 20)
          .where("u2.age", "<", 40);
      }, "ageRangeCount")
      .where("name", "Alice")
      .oneOrFail();

    expect(user.name).toBe("Alice");
    expect(Number(user.ageRangeCount)).toBe(1);
  });

  test("should handle subquery with groupBy", async () => {
    await SqlDataSource.instance.query("users_without_pk").insertMany([
      { name: "Bob", age: 30, email: "bob@test.com" },
      { name: "Charlie", age: 35, email: "charlie@test.com" },
    ]);

    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .select("name")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ avgAge: number }>("AVG(age) as avgAge")
          .from("users_without_pk");
      }, "avgAge")
      .groupBy("name")
      .orderBy("name", "asc")
      .many();

    expect(users).toHaveLength(3);
    expect(users[0].avgAge).toBeDefined();
  });

  test("should handle subquery with limit", async () => {
    const user = await SqlDataSource.instance
      .query("users_without_pk")
      .select("name")
      .select<number>((subQuery) => {
        subQuery
          .selectRaw<{ maxAge: number }>("MAX(age) as maxAge")
          .from("users_without_pk");
      }, "maxAge")
      .where("name", "Alice")
      .oneOrFail();

    expect(user.name).toBe("Alice");
    expect(Number(user.maxAge)).toBe(25);
  });
});
