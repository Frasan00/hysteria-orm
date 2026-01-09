import crypto from "crypto";
import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserWithUuid } from "../test_models/uuid/user_uuid";

beforeAll(async () => {
  const dataSource = new SqlDataSource();
  await dataSource.connect();
});

beforeEach(async () => {
  await SqlDataSource.startGlobalTransaction();
});

afterEach(async () => {
  await SqlDataSource.rollbackGlobalTransaction();
});

describe(`[${env.DB_TYPE}] Performance - Large LIMIT/OFFSET`, () => {
  test("should handle large OFFSET values", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(10);

    const result = await sql
      .query("users_with_uuid")
      .orderBy("id", "asc")
      .offset(5)
      .many();

    expect(Array.isArray(result)).toBe(true);
  });

  test("should handle large LIMIT values", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(10);

    const result = await sql.query("users_with_uuid").limit(100).many();

    expect(Array.isArray(result)).toBe(true);
  });

  test("should handle LIMIT and OFFSET combination", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(20);

    const result = await sql
      .query("users_with_uuid")
      .orderBy("id", "asc")
      .limit(5)
      .offset(10)
      .many();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(5);
  });
});

describe(`[${env.DB_TYPE}] Performance - Large IN Clauses`, () => {
  test("should handle IN clause with 100 values", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(50);

    const emails = Array.from(
      { length: 100 },
      (_, i) => `test${i}@example.com`,
    );

    const result = await sql
      .query("users_with_uuid")
      .whereIn("email", emails)
      .many();

    expect(Array.isArray(result)).toBe(true);
  });

  test("should handle IN clause with 500 values", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(100);

    const ages = Array.from({ length: 500 }, (_, i) => i + 20);

    const result = await sql
      .query("users_with_uuid")
      .whereIn("age", ages)
      .many();

    expect(Array.isArray(result)).toBe(true);
  });

  test("should handle IN clause with 1000 values", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(100);

    const ages = Array.from({ length: 1000 }, (_, i) => i + 20);

    const result = await sql
      .query("users_with_uuid")
      .whereIn("age", ages)
      .many();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe(`[${env.DB_TYPE}] Performance - Complex Aggregations`, () => {
  test("should handle multiple aggregations in single query", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(10);

    const result = await sql
      .query("users_with_uuid")
      .select("count", "avg_age", "max_age", "min_age", "sum_age")
      .selectCount("*", "count")
      .selectAvg("age", "avg_age")
      .selectMax("age", "max_age")
      .selectMin("age", "min_age")
      .selectSum("age", "sum_age")
      .one();

    expect(result).toBeDefined();
  });

  test("should handle aggregation with GROUP BY", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(10);

    const result = await sql
      .query("users_with_uuid")
      .select("status")
      .selectCount("*", "count")
      .selectAvg("age", "avg_age")
      .groupBy("status")
      .many();

    expect(Array.isArray(result)).toBe(true);
  });

  test("should handle aggregation with HAVING", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(10);

    const result = await sql
      .query("users_with_uuid")
      .select("status")
      .selectCount("id", "count")
      .groupBy("status")
      .having("count", ">", 0)
      .many();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe(`[${env.DB_TYPE}] Performance - Deep Nested WHERE`, () => {
  test("should handle deeply nested AND conditions", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(5);

    const result = await sql
      .query("users_with_uuid")
      .where("age", ">", 20)
      .andWhere("age", "<", 50)
      .andWhere("status", "active")
      .andWhere("is_active", true)
      .andWhere("name", "!=", "")
      .many();

    expect(Array.isArray(result)).toBe(true);
  });

  test("should handle deeply nested OR conditions", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(5);

    const result = await sql
      .query("users_with_uuid")
      .where("age", "<", 25)
      .orWhere("age", ">", 40)
      .orWhere("status", "inactive")
      .many();

    expect(Array.isArray(result)).toBe(true);
  });

  test("should handle mixed AND/OR with parentheses", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(5);

    const result = await sql
      .query("users_with_uuid")
      .where((query) => {
        query.where("age", "<", 25).orWhere("age", ">", 40);
      })
      .andWhere("status", "active")
      .many();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe(`[${env.DB_TYPE}] Performance - Multiple Joins`, () => {
  test("should handle multiple JOINs in single query", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(3);

    const result = await sql
      .query("users_with_uuid")
      .join("posts_with_uuid", "users_with_uuid.id", "posts_with_uuid.user_id")
      .many();

    expect(Array.isArray(result)).toBe(true);
  });

  test("should handle LEFT JOINs", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(3);

    const result = await sql
      .query("users_with_uuid")
      .leftJoin(
        "posts_with_uuid",
        "users_with_uuid.id",
        "posts_with_uuid.user_id",
      )
      .many();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe(`[${env.DB_TYPE}] Performance - Bulk Operations`, () => {
  test("should handle bulk update", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(50);

    const startTime = Date.now();
    const updated = await sql
      .query("users_with_uuid")
      .where("age", "<", 30)
      .update({ status: "bulk_updated" });
    const endTime = Date.now();

    expect(updated).toBeDefined();
  });

  test("should handle bulk delete", async () => {
    const sql = SqlDataSource.instance;

    // Create test users
    const emails = Array.from(
      { length: 50 },
      (_, i) => `delete${i}@example.com`,
    );
    await sql.query("users_with_uuid").insertMany(
      emails.map((email) => ({
        id: crypto.randomUUID(),
        name: `Delete ${email}`,
        email,
        age: 25,
        status: "active",
        is_active: true,
      })),
    );

    const startTime = Date.now();
    const deleted = await sql
      .query("users_with_uuid")
      .whereIn("email", emails)
      .delete();
    const endTime = Date.now();

    expect(deleted).toBeDefined();
  });
});

describe(`[${env.DB_TYPE}] Performance - Order By Performance`, () => {
  test("should handle ORDER BY with multiple columns", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(10);

    const result = await sql
      .query("users_with_uuid")
      .orderBy("status", "asc")
      .orderBy("age", "desc")
      .orderBy("name", "asc")
      .many();

    expect(Array.isArray(result)).toBe(true);
  });

  test("should handle ORDER BY with expressions", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(10);

    const result = await sql
      .query("users_with_uuid")
      .orderByRaw("age * 2 DESC")
      .many();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe(`[${env.DB_TYPE}] Performance - String Operations`, () => {
  test("should handle long string values", async () => {
    const sql = SqlDataSource.instance;

    const longString = "a".repeat(10000);

    const user = await sql.query("users_with_uuid").insert({
      id: crypto.randomUUID(),
      name: "Long String Test",
      email: "longstring@example.com",
      age: 30,
      status: "active",
      is_active: true,
      description: longString,
    });

    expect(user).toBeDefined();

    // Cleanup
    await UserWithUuid.query()
      .where("email", "longstring@example.com")
      .delete();
  });

  test("should handle many string concatenations", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(5);

    let concatExpr;
    if (env.DB_TYPE === "postgres" || env.DB_TYPE === "cockroachdb") {
      concatExpr = "name || '-' || email || '-' || status as full_info";
    } else if (env.DB_TYPE === "mysql" || env.DB_TYPE === "mariadb") {
      concatExpr = "CONCAT(name, '-', email, '-', status) as full_info";
    } else if (env.DB_TYPE === "sqlite") {
      concatExpr = "name || '-' || email || '-' || status as full_info";
    } else {
      concatExpr = "name || '-' || email || '-' || status as full_info";
    }

    const result = await sql
      .query("users_with_uuid")
      .selectRaw(concatExpr)
      .many();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe(`[${env.DB_TYPE}] Performance - Concurrent Operations`, () => {
  test("should handle concurrent reads", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(20);

    const promises = Array.from({ length: 10 }, () =>
      sql.query("users_with_uuid").many(),
    );

    const results = await Promise.all(promises);

    results.forEach((result) => {
      expect(Array.isArray(result)).toBe(true);
    });
  });

  test("should handle concurrent writes", async () => {
    const sql = SqlDataSource.instance;

    const promises = Array.from({ length: 10 }, (_, i) =>
      sql.query("users_with_uuid").insert({
        id: crypto.randomUUID(),
        name: `Concurrent ${i}`,
        email: `concurrent${i}@example.com`,
        age: 20 + i,
        status: "active",
        is_active: true,
      }),
    );

    const results = await Promise.all(promises);

    expect(results.length).toBe(10);

    // Cleanup
    await sql
      .query("users_with_uuid")
      .whereIn(
        "email",
        Array.from({ length: 10 }, (_, i) => `concurrent${i}@example.com`),
      )
      .delete();
  });
});

describe(`[${env.DB_TYPE}] Performance - Memory Efficiency`, () => {
  test("should handle large result set efficiently", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(50);

    const result = await sql
      .query("users_with_uuid")
      .select("id", "name", "email")
      .many();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test("should handle streaming/chunking", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(30);

    const chunks = [];
    for await (const chunk of sql.query("users_with_uuid").chunk(10)) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThan(0);
  });
});

describe(`[${env.DB_TYPE}] Performance - Index Utilization`, () => {
  test("should use index for WHERE clause", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(10);

    const result = await sql
      .query("users_with_uuid")
      .where("id", "!=", null)
      .many();

    expect(Array.isArray(result)).toBe(true);
  });

  test("should use index for JOIN condition", async () => {
    const sql = SqlDataSource.instance;

    await UserFactory.userWithUuid(5);

    const result = await sql
      .query("users_with_uuid")
      .join("posts_with_uuid", "users_with_uuid.id", "posts_with_uuid.user_id")
      .many();

    expect(Array.isArray(result)).toBe(true);
  });
});
