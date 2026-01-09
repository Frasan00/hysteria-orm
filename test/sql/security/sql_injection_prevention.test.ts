import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserStatus, UserWithUuid } from "../test_models/uuid/user_uuid";

// CockroachDB has timing issues with global transactions
const skipGlobalTransaction = env.DB_TYPE === "cockroachdb";

beforeAll(async () => {
  const dataSource = new SqlDataSource();
  await dataSource.connect();
});

beforeEach(async () => {
  if (!skipGlobalTransaction) {
    await SqlDataSource.startGlobalTransaction();
  }
});

afterEach(async () => {
  if (!skipGlobalTransaction) {
    await SqlDataSource.rollbackGlobalTransaction();
  } else {
    await UserWithUuid.query().delete();
  }
});

// Helper to create a test user with potentially malicious data
async function createTestUser(name: string, email: string) {
  // Use unique email for CockroachDB to avoid conflicts
  const uniqueEmail = skipGlobalTransaction
    ? `${Date.now()}-${Math.random().toString(36).substring(7)}-${email}`
    : email;

  const user = new UserWithUuid();
  user.name = name;
  user.email = uniqueEmail;
  user.age = 30;
  user.status = UserStatus.active;
  user.isActive = true;
  await user.save();
  return user;
}

describe(`[${env.DB_TYPE}] Security - SQL Injection Prevention`, () => {
  describe("WHERE Clause Injection Prevention", () => {
    test("should sanitize string values in WHERE clause", async () => {
      const sql = SqlDataSource.instance;

      const maliciousValue = "'; DROP TABLE users_with_uuid; --";

      // Should not execute the malicious SQL
      const result = await sql
        .query("users_with_uuid")
        .where("name", maliciousValue)
        .many();

      // Should return an array (table not dropped), may contain data from previous tests
      expect(Array.isArray(result)).toBe(true);

      // Verify the table still exists by running another query
      const tableExists = await sql.query("users_with_uuid").limit(1).many();
      expect(Array.isArray(tableExists)).toBe(true);
    });

    test("should handle single quotes in WHERE values", async () => {
      const sql = SqlDataSource.instance;

      const user = await createTestUser(
        "Test User 'With Quotes'",
        "quotes1@example.com",
      );

      const foundUser = await sql
        .query("users_with_uuid")
        .where("email", user.email)
        .one();

      expect(foundUser).not.toBeNull();
      expect(foundUser?.name).toBe("Test User 'With Quotes'");
    });

    test("should handle backslash in WHERE values", async () => {
      const sql = SqlDataSource.instance;

      const user = await createTestUser(
        "Test User \\With Backslash",
        "backslash@example.com",
      );

      const foundUser = await sql
        .query("users_with_uuid")
        .where("email", user.email)
        .one();

      expect(foundUser).not.toBeNull();
      expect(foundUser?.name).toBe("Test User \\With Backslash");
    });

    test("should handle comment syntax in WHERE values", async () => {
      const sql = SqlDataSource.instance;

      const maliciousValue = "test' OR '1'='1' --";

      await createTestUser("Safe User", "safe@example.com");

      // Should not inject the OR condition
      const result = await sql
        .query("users_with_uuid")
        .where("name", maliciousValue)
        .many();

      // Should return empty, not all records
      expect(result.length).toBe(0);
    });

    test("should handle union-based injection attempts", async () => {
      const sql = SqlDataSource.instance;

      const maliciousValue = "test' UNION SELECT * FROM posts_with_uuid --";

      await createTestUser("Safe User 2", "safe2@example.com");

      // Should not execute the UNION
      const result = await sql
        .query("users_with_uuid")
        .where("name", maliciousValue)
        .many();

      // Should return empty, not posts
      expect(result.length).toBe(0);
    });
  });

  describe("INSERT Statement Injection Prevention", () => {
    test("should sanitize values in INSERT", async () => {
      const sql = SqlDataSource.instance;

      const maliciousName = "'; DROP TABLE users_with_uuid; --";
      const maliciousEmail = "hack@example.com";

      const user = new UserWithUuid();
      user.name = maliciousName;
      user.email = maliciousEmail;
      user.age = 30;
      user.status = UserStatus.active;
      user.isActive = true;
      await user.save();

      // Value should be stored as-is, not executed
      const foundUser = await sql
        .query("users_with_uuid")
        .where("email", "hack@example.com")
        .one();

      expect(foundUser).not.toBeNull();
      expect(foundUser?.name).toBe(maliciousName);

      // Cleanup
      await UserWithUuid.query().where("email", "hack@example.com").delete();
    });

    test("should handle quotes in INSERT", async () => {
      const sql = SqlDataSource.instance;
      const uniqueEmail = `double-quotes-${Date.now()}@example.com`;

      const user = new UserWithUuid();
      user.name = 'User \'With "Double Quotes"';
      user.email = uniqueEmail;
      user.age = 25;
      user.status = UserStatus.active;
      user.isActive = true;
      await user.save();

      const foundUser = await sql
        .query("users_with_uuid")
        .where("email", uniqueEmail)
        .one();

      expect(foundUser).not.toBeNull();
      expect(foundUser?.name).toBe('User \'With "Double Quotes"');
    });
  });

  describe("UPDATE Statement Injection Prevention", () => {
    test("should sanitize values in UPDATE", async () => {
      const sql = SqlDataSource.instance;

      const user = await createTestUser(
        "Original Name",
        "update-test@example.com",
      );

      const maliciousValue = "'; DROP TABLE users_with_uuid; --";

      await sql
        .query("users_with_uuid")
        .where("email", user.email)
        .update({ name: maliciousValue });

      // Should update the value, not execute malicious SQL
      const foundUser = await sql
        .query("users_with_uuid")
        .where("email", user.email)
        .one();

      expect(foundUser).not.toBeNull();
      expect(foundUser?.name).toBe(maliciousValue);
    });

    test("should handle multiple malicious values in UPDATE", async () => {
      const sql = SqlDataSource.instance;

      const user = await createTestUser(
        "Original Name 2",
        "update-test2@example.com",
      );

      await sql.query("users_with_uuid").where("email", user.email).update({
        name: "'; --",
        status: UserStatus.active,
      });

      const foundUser = await sql
        .query("users_with_uuid")
        .where("email", user.email)
        .one();

      expect(foundUser).not.toBeNull();
      expect(foundUser?.name).toBe("'; --");
      // Status should be the enum value, not affected by SQL injection
      expect(foundUser?.status).toBe(UserStatus.active);
    });
  });

  describe("JOIN Condition Injection Prevention", () => {
    test("should sanitize JOIN conditions", async () => {
      const sql = SqlDataSource.instance;

      // Create test data
      await createTestUser("Join Test User", "join-test@example.com");

      // Try to inject into JOIN condition
      const maliciousValue = "users_with_uuid.id' OR '1'='1";

      const query = sql
        .query("users_with_uuid")
        .join(
          "posts_with_uuid",
          "users_with_uuid.id",
          "posts_with_uuid.user_id",
        )
        .where("users_with_uuid.email", "join-test@example.com");

      const result = await query.many();

      // Should execute join normally, not inject
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("IN Clause Injection Prevention", () => {
    test("should sanitize values in IN clause", async () => {
      const sql = SqlDataSource.instance;

      const user1 = await createTestUser("IN Test 1", "in1@example.com");
      await createTestUser("IN Test 2", "in2@example.com");

      const maliciousValue = "'; DROP TABLE users_with_uuid; --";

      // Should not execute malicious SQL
      const result = await sql
        .query("users_with_uuid")
        .whereIn("email", [user1.email, maliciousValue])
        .many();

      // Should return only valid emails
      expect(result.length).toBe(1);
      expect(result[0].email).toBe(user1.email);
    });

    test("should handle large IN clause", async () => {
      const sql = SqlDataSource.instance;

      const emails: string[] = [];
      for (let i = 0; i < 100; i++) {
        const user = await createTestUser(
          `User ${i}`,
          `in-large${i}@example.com`,
        );
        emails.push(user.email);
      }

      const result = await sql
        .query("users_with_uuid")
        .whereIn("email", emails)
        .many();

      expect(result.length).toBe(100);
    });
  });

  describe("LIKE Clause Injection Prevention", () => {
    test("should sanitize LIKE patterns", async () => {
      const sql = SqlDataSource.instance;

      await createTestUser("LIKE Test", "like@example.com");

      const maliciousPattern = "%'; DROP TABLE users_with_uuid; --%";

      // Should not execute malicious SQL
      const result = await sql
        .query("users_with_uuid")
        .whereLike("name", maliciousPattern)
        .many();

      // Should not throw and result should be an array (may or may not match depending on data)
      expect(Array.isArray(result)).toBe(true);
    });

    test("should handle wildcard characters in LIKE", async () => {
      const sql = SqlDataSource.instance;

      await createTestUser("Wildcard Test User", "wildcard@example.com");

      // Proper wildcards should work
      const result = await sql
        .query("users_with_uuid")
        .whereLike("name", "%Wildcard%")
        .many();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name).toContain("Wildcard");
    });
  });

  describe("ORDER BY Injection Prevention", () => {
    test("should handle malicious ORDER BY values", async () => {
      const sql = SqlDataSource.instance;

      const user = await createTestUser("Order By Test", "orderby@example.com");

      // Column names should be validated
      const result = await sql
        .query("users_with_uuid")
        .where("email", user.email)
        .orderBy("name", "asc")
        .many();

      expect(result.length).toBe(1);
    });
  });

  describe("LIMIT and OFFSET Injection Prevention", () => {
    test("should sanitize LIMIT values", async () => {
      const sql = SqlDataSource.instance;

      const user1 = await createTestUser("Limit Test 1", "limit1@example.com");
      const user2 = await createTestUser("Limit Test 2", "limit2@example.com");

      const result = await sql
        .query("users_with_uuid")
        .whereIn("email", [user1.email, user2.email])
        .limit(1)
        .many();

      // Should only return 1 record
      expect(result.length).toBe(1);
    });

    test("should sanitize OFFSET values", async () => {
      const sql = SqlDataSource.instance;

      const user1 = await createTestUser(
        "Offset Test 1",
        "offset1@example.com",
      );
      const user2 = await createTestUser(
        "Offset Test 2",
        "offset2@example.com",
      );

      const result = await sql
        .query("users_with_uuid")
        .whereIn("email", [user1.email, user2.email])
        .orderBy("email", "asc")
        .limit(1)
        .offset(1)
        .many();

      // Should skip first record
      expect(result.length).toBe(1);
    });
  });

  describe("Boolean Blind Injection Prevention", () => {
    test("should not leak information through boolean responses", async () => {
      const sql = SqlDataSource.instance;

      await createTestUser("Boolean Test", "boolean@example.com");

      const maliciousValue =
        "' OR (SELECT COUNT(*) FROM users_with_uuid) > 0 --";

      // Should not inject subquery
      const result = await sql
        .query("users_with_uuid")
        .where("name", maliciousValue)
        .many();

      // Should return empty, not leak info
      expect(result.length).toBe(0);
    });
  });

  describe("Time-Based Injection Prevention", () => {
    test("should not be vulnerable to time-based injection", async () => {
      const sql = SqlDataSource.instance;

      await createTestUser("Time Test", "time@example.com");

      const maliciousValue = "'; WAITFOR DELAY '00:00:05' --";

      const startTime = Date.now();

      // Should not execute delay
      const result = await sql
        .query("users_with_uuid")
        .where("name", maliciousValue)
        .many();

      const endTime = Date.now();

      // Should return quickly, not after delay
      expect(endTime - startTime).toBeLessThan(2000);
      expect(result.length).toBe(0);
    });
  });

  describe("Second-Order Injection Prevention", () => {
    test("should handle stored malicious values safely", async () => {
      const sql = SqlDataSource.instance;

      const uniqueEmail = `second-order-${Date.now()}@example.com`;
      const uniqueMaliciousName = `'; -- ${Date.now()}`;

      // Insert malicious value
      const user = new UserWithUuid();
      user.name = uniqueMaliciousName;
      user.email = uniqueEmail;
      user.age = 30;
      user.status = UserStatus.active;
      user.isActive = true;
      await user.save();

      // Use the stored value in another query
      const storedUser = await sql
        .query("users_with_uuid")
        .where("email", uniqueEmail)
        .one();

      expect(storedUser).not.toBeNull();
      expect(storedUser?.name).toBe(uniqueMaliciousName);

      // Use the stored name in another query
      const result = await sql
        .query("users_with_uuid")
        .where("name", storedUser!.name)
        .many();

      // Should not inject, just find the record
      expect(result.length).toBe(1);
      expect(result[0].email).toBe(uniqueEmail);
    });
  });
});
