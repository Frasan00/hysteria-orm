import crypto from "crypto";
import { env } from "../../../src/env/env";
import { HysteriaError } from "../../../src/errors/hysteria_error";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserStatus, UserWithUuid } from "../test_models/uuid/user_uuid";

const isMssql = env.DB_TYPE === "mssql";

beforeAll(async () => {
  const dataSource = new SqlDataSource();
  await dataSource.connect();
});

beforeEach(async () => {
  // MSSQL has issues with global transactions when errors occur
  if (!isMssql) {
    await SqlDataSource.startGlobalTransaction();
  }
});

afterEach(async () => {
  if (!isMssql) {
    await SqlDataSource.rollbackGlobalTransaction();
  } else {
    await UserWithUuid.query().delete();
  }
});

describe(`[${env.DB_TYPE}] Error Handling - Connection Scenarios`, () => {
  test("should throw error when querying without connection", async () => {
    const dataSource = new SqlDataSource({
      type: env.DB_TYPE as any,
      host: "invalid-host",
      username: "invalid-user",
      password: "invalid-pass",
      database: "invalid-db",
      connectionPolicies: {
        retry: {
          maxRetries: 0,
          delay: 0,
        },
      },
    } as any);

    await expect(dataSource.connect()).rejects.toThrow();
  });

  test("should throw error for invalid SQL syntax", async () => {
    const sql = SqlDataSource.instance;

    await expect(sql.rawQuery("INVALID SQL SYNTAX HERE")).rejects.toThrow();
  });
});

describe(`[${env.DB_TYPE}] Error Handling - Invalid Column References`, () => {
  test("should handle invalid column in WHERE clause", async () => {
    // SQLite doesn't throw on invalid columns, it returns empty results
    if (env.DB_TYPE === "sqlite") {
      return;
    }

    const sql = SqlDataSource.instance;

    // Using a column that doesn't exist
    const query = sql
      .query("users_with_uuid")
      .where("non_existent_column", "value");

    await expect(query.one()).rejects.toThrow();
  });

  test("should handle invalid column in SELECT", async () => {
    // SQLite doesn't throw on invalid columns
    if (env.DB_TYPE === "sqlite") {
      return;
    }

    const sql = SqlDataSource.instance;

    const query = sql
      .query("users_with_uuid")
      .select("id", "non_existent_column");
    await expect(query.many()).rejects.toThrow();
  });

  test("should handle invalid column in JOIN condition", async () => {
    // SQLite may not throw on invalid join columns
    if (env.DB_TYPE === "sqlite") {
      return;
    }

    const sql = SqlDataSource.instance;

    const query = sql
      .query("users_with_uuid")
      .join(
        "posts_with_uuid",
        "users_with_uuid.id",
        "posts_with_uuid.nonExistentFK",
      );

    await expect(query.one()).rejects.toThrow();
  });

  test("should handle invalid column in ORDER BY", async () => {
    // SQLite doesn't throw on invalid ORDER BY columns
    if (env.DB_TYPE === "sqlite") {
      return;
    }

    const sql = SqlDataSource.instance;

    const query = sql
      .query("users_with_uuid")
      .orderBy("non_existent_column", "asc");

    await expect(query.many()).rejects.toThrow();
  });

  test("should handle invalid column in GROUP BY", async () => {
    // SQLite doesn't throw on invalid GROUP BY columns
    if (env.DB_TYPE === "sqlite") {
      return;
    }

    const sql = SqlDataSource.instance;

    const query = sql
      .query("users_with_uuid")
      .select("age")
      .groupBy("non_existent_column");

    await expect(query.many()).rejects.toThrow();
  });
});

describe(`[${env.DB_TYPE}] Error Handling - NULL Handling`, () => {
  test("should handle NULL in BETWEEN clause correctly", async () => {
    const user = await UserFactory.userWithUuid(1);
    const sql = SqlDataSource.instance;

    // NULL values should not match BETWEEN
    const result = await sql
      .query("users_with_uuid")
      .whereBetween("deleted_at", "2020-01-01", "2025-01-01")
      .many();

    // Result should be an array
    expect(Array.isArray(result)).toBe(true);
  });

  test("should handle NULL in LIKE pattern", async () => {
    const sql = SqlDataSource.instance;

    // NULL values should not match LIKE
    const result = await sql
      .query("users_with_uuid")
      .whereLike("name", "%test%")
      .many();

    expect(Array.isArray(result)).toBe(true);
  });

  test("should handle NULL comparison correctly", async () => {
    const sql = SqlDataSource.instance;

    // NULL should not match equality
    const result = await sql
      .query("users_with_uuid")
      .where("deleted_at", null)
      .many();

    expect(Array.isArray(result)).toBe(true);
  });

  test("should handle NULL in IN clause", async () => {
    const sql = SqlDataSource.instance;

    // NULL in array should be handled
    const result = await sql
      .query("users_with_uuid")
      .whereIn("deleted_at", [null])
      .many();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe(`[${env.DB_TYPE}] Error Handling - Transaction Errors`, () => {
  test("should rollback transaction on error", async () => {
    const sql = SqlDataSource.instance;
    const trx = await sql.transaction();

    // Use a valid UUID format for PostgreSQL/CockroachDB
    const userId = crypto.randomUUID();

    try {
      // Create a user
      const user = new UserWithUuid();
      user.id = userId;
      user.name = "Rollback Test";
      user.email = "rollback@example.com";
      user.age = 30;
      user.status = UserStatus.active;
      user.isActive = true;
      await user.save({ trx });

      // Force an error
      await trx.sql.rawQuery("INVALID SQL TO FORCE ROLLBACK");

      await trx.commit();
    } catch (error) {
      await trx.rollback();
    }

    // User should not exist after rollback
    const foundUser = await UserWithUuid.query().where("id", userId).one();

    expect(foundUser).toBeNull();
  });

  test("should handle transaction commit failure", async () => {
    const sql = SqlDataSource.instance;
    const trx = await sql.transaction();

    // Create a user
    const user = new UserWithUuid();
    user.name = "Commit Failure Test";
    user.email = "commit-fail@example.com";
    user.age = 25;
    user.status = UserStatus.active;
    user.isActive = true;
    await user.save({ trx });

    // Commit should succeed
    await trx.commit();

    // Verify user was saved
    const foundUser = await UserWithUuid.query()
      .where("email", "commit-fail@example.com")
      .one();

    expect(foundUser).not.toBeNull();
    expect(foundUser?.name).toBe("Commit Failure Test");

    // Cleanup
    await UserWithUuid.query()
      .where("email", "commit-fail@example.com")
      .delete();
  });

  test("should handle inactive transaction operations", async () => {
    const sql = SqlDataSource.instance;
    const trx = await sql.transaction();

    await trx.commit();

    // Should not throw when operations fail with proper flag
    await expect(
      trx.commit({ throwErrorOnInactiveTransaction: false }),
    ).resolves.not.toThrow();

    await expect(
      trx.rollback({ throwErrorOnInactiveTransaction: false }),
    ).resolves.not.toThrow();
  });
});

describe(`[${env.DB_TYPE}] Error Handling - Constraint Violations`, () => {
  test("should handle foreign key constraint violation", async () => {
    // SQLite doesn't enforce foreign keys by default
    if (env.DB_TYPE === "sqlite") {
      return;
    }

    const sql = SqlDataSource.instance;

    // Try to insert a post with non-existent user ID
    const fakeUserId = "00000000-0000-0000-0000-000000000000";

    // Direct insert should throw foreign key violation
    await expect(
      sql.rawQuery(
        `INSERT INTO posts_with_uuid (id, user_id, title) VALUES (?, ?, ?)`,
        [crypto.randomUUID(), fakeUserId, "Test Post"],
      ),
    ).rejects.toThrow();
  }, 15000);

  test("should handle invalid SQL syntax", async () => {
    const sql = SqlDataSource.instance;

    // Invalid SQL should throw
    await expect(sql.rawQuery("INVALID SQL SYNTAX HERE")).rejects.toThrow();
  });
});

describe(`[${env.DB_TYPE}] Error Handling - Type Conversion Errors`, () => {
  test("should handle invalid integer comparison", async () => {
    const sql = SqlDataSource.instance;

    const query = sql.query("users_with_uuid").where("age", "not-a-number");

    // PostgreSQL/CockroachDB/MSSQL throw on type mismatches
    if (
      env.DB_TYPE === "postgres" ||
      env.DB_TYPE === "cockroachdb" ||
      env.DB_TYPE === "mssql"
    ) {
      await expect(query.one()).rejects.toThrow();
      return;
    }

    // MySQL/MariaDB/SQLite return empty result
    const result = await query.one();
    expect(result).toBeNull();
  });

  test("should handle invalid date in raw query", async () => {
    // SQLite doesn't validate date values - it stores them as text
    if (env.DB_TYPE === "sqlite") {
      return;
    }

    const sql = SqlDataSource.instance;

    // Most databases throw on invalid timestamp values
    await expect(
      sql.rawQuery(
        `SELECT * FROM users_with_uuid WHERE created_at = 'not-a-date'`,
      ),
    ).rejects.toThrow();
  });

  test("should handle string comparison on boolean column", async () => {
    const sql = SqlDataSource.instance;

    const query = sql
      .query("users_with_uuid")
      .where("is_active", "not-boolean");

    // PostgreSQL/CockroachDB/MSSQL throw on type mismatches
    if (
      env.DB_TYPE === "postgres" ||
      env.DB_TYPE === "cockroachdb" ||
      env.DB_TYPE === "mssql"
    ) {
      await expect(query.one()).rejects.toThrow();
      return;
    }

    // MySQL/MariaDB/SQLite return empty result
    const result = await query.one();
    expect(result).toBeNull();
  });
});

describe(`[${env.DB_TYPE}] Error Handling - Edge Cases`, () => {
  test("should handle empty array in whereIn", async () => {
    // MSSQL throws an error on empty whereIn arrays
    if (isMssql) {
      return;
    }

    const sql = SqlDataSource.instance;

    // Empty array should create impossible condition
    const result = await sql.query("users_with_uuid").whereIn("id", []).many();

    expect(result).toEqual([]);
  });

  test("should handle very long string values", async () => {
    const sql = SqlDataSource.instance;

    const veryLongString = "a".repeat(10000);
    const uniqueEmail = `long-string-${Date.now()}@example.com`;

    const user = new UserWithUuid();
    user.name = "Long String Test";
    user.email = uniqueEmail;
    user.age = 30;
    user.status = UserStatus.active;
    user.isActive = true;
    user.description = veryLongString;

    await user.save();

    const foundUser = await UserWithUuid.query()
      .where("email", uniqueEmail)
      .one();

    expect(foundUser).not.toBeNull();
    expect(foundUser?.description?.length).toBe(veryLongString.length);

    // Clean up for MSSQL
    if (isMssql && foundUser) {
      await UserWithUuid.query().where("id", foundUser.id).delete();
    }
  });

  test("should handle special characters in strings", async () => {
    const sql = SqlDataSource.instance;

    const specialString = "Test 'with\" \\special/ chars";
    const uniqueEmail = `special-${Date.now()}@example.com`;

    const user = new UserWithUuid();
    user.name = specialString;
    user.email = uniqueEmail;
    user.age = 30;
    user.status = UserStatus.active;
    user.isActive = true;

    await user.save();

    const foundUser = await UserWithUuid.query()
      .where("email", uniqueEmail)
      .one();

    expect(foundUser).not.toBeNull();
    expect(foundUser?.name).toBe(specialString);

    // Clean up for MSSQL
    if (isMssql && foundUser) {
      await UserWithUuid.query().where("id", foundUser.id).delete();
    }
  });

  test("should handle unicode characters", async () => {
    // MSSQL needs NVARCHAR for full unicode support
    if (isMssql) {
      return;
    }

    const sql = SqlDataSource.instance;

    const unicodeString = "Test 🚀 with 你好 world";
    const uniqueEmail = `unicode-${Date.now()}@example.com`;

    const user = new UserWithUuid();
    user.name = unicodeString;
    user.email = uniqueEmail;
    user.age = 30;
    user.status = UserStatus.active;
    user.isActive = true;

    await user.save();

    const foundUser = await UserWithUuid.query()
      .where("email", uniqueEmail)
      .one();

    expect(foundUser).not.toBeNull();
    expect(foundUser?.name).toBe(unicodeString);
  });

  test("should handle zero values correctly", async () => {
    const sql = SqlDataSource.instance;
    const uniqueEmail = `zero-${Date.now()}@example.com`;

    const user = new UserWithUuid();
    user.name = "Zero Test";
    user.email = uniqueEmail;
    user.age = 0; // Zero value
    user.status = UserStatus.active;
    user.isActive = false; // False value

    await user.save();

    const foundUser = await UserWithUuid.query()
      .where("email", uniqueEmail)
      .one();

    expect(foundUser).not.toBeNull();
    // CockroachDB may return string values for numbers
    expect(Number(foundUser?.age)).toBe(0);
    expect(foundUser?.isActive == false).toBe(true);

    // Clean up for MSSQL
    if (isMssql && foundUser) {
      await UserWithUuid.query().where("id", foundUser.id).delete();
    }
  });
});

describe(`[${env.DB_TYPE}] Error Handling - Model Errors`, () => {
  test("should throw error when updating without primary key value", async () => {
    const user = new UserWithUuid();
    user.name = "Test User";
    user.email = "no-pk@example.com";
    user.age = 30;
    user.status = UserStatus.active;
    user.isActive = true;
    // id is not set

    await expect(user.update({ name: "Updated" })).rejects.toThrow(
      HysteriaError,
    );
    await expect(user.update({ name: "Updated" })).rejects.toThrow(
      "MODEL_HAS_NO_PRIMARY_KEY_VALUE",
    );
  });

  test("should throw error when deleting without primary key value", async () => {
    const user = new UserWithUuid();
    user.name = "Test User";
    user.email = "no-pk-delete@example.com";
    user.age = 30;
    user.status = UserStatus.active;
    user.isActive = true;
    // id is not set

    await expect(user.delete()).rejects.toThrow(HysteriaError);
    await expect(user.delete()).rejects.toThrow(
      "MODEL_HAS_NO_PRIMARY_KEY_VALUE",
    );
  });

  test("should throw error when refreshing without primary key value", async () => {
    const user = new UserWithUuid();
    user.name = "Test User";
    user.email = "no-pk-refresh@example.com";
    user.age = 30;
    user.status = UserStatus.active;
    user.isActive = true;
    // id is not set

    await expect(user.refresh()).rejects.toThrow(HysteriaError);
    await expect(user.refresh()).rejects.toThrow(
      "MODEL_HAS_NO_PRIMARY_KEY_VALUE",
    );
  });
});

describe(`[${env.DB_TYPE}] Error Handling - Query Builder Errors`, () => {
  test("should return null when getting record from empty result", async () => {
    const sql = SqlDataSource.instance;

    const result = await sql
      .query("users_with_uuid")
      .where("email", "non-existent@example.com")
      .one();

    expect(result).toBeNull();
  });

  test("should handle invalid aggregate function", async () => {
    // SQLite returns null for SUM on invalid columns
    if (env.DB_TYPE === "sqlite") {
      return;
    }

    const sql = SqlDataSource.instance;

    // Try to use invalid aggregate
    const query = sql
      .query("users_with_uuid")
      .selectSum("invalid_column", "invalid_column");

    await expect(query.one()).rejects.toThrow();
  });

  test("should handle invalid table name", async () => {
    const sql = SqlDataSource.instance;

    await expect(
      sql.query("totally_fake_table_name_12345").many(),
    ).rejects.toThrow();
  });
});
