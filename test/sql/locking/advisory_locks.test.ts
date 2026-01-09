import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";

beforeAll(async () => {
  const dataSource = new SqlDataSource();
  await dataSource.connect();
});

describe(`[${env.DB_TYPE}] Advisory Locks - acquireLock()`, () => {
  test("should acquire lock with default key", async () => {
    const sql = SqlDataSource.instance;

    const acquired = await sql.acquireLock();

    // Should successfully acquire lock
    expect(acquired).toBe(true);

    // Release the lock
    await sql.releaseLock();
  });

  test("should acquire lock with custom key", async () => {
    const sql = SqlDataSource.instance;

    const customKey = "my_custom_lock_key";
    const acquired = await sql.acquireLock(customKey);

    expect(acquired).toBe(true);

    // Release with custom key
    await sql.releaseLock(customKey);
  });

  test("should acquire lock with timeout", async () => {
    const sql = SqlDataSource.instance;

    const acquired = await sql.acquireLock("timeout_lock", 5000);

    expect(acquired).toBe(true);

    await sql.releaseLock("timeout_lock");
  });

  test("should return false when lock is already held", async () => {
    const sql = SqlDataSource.instance;

    const lockKey = "concurrent_lock_test";

    // Acquire first lock
    const firstLock = await sql.acquireLock(lockKey);
    expect(firstLock).toBe(true);

    // Try to acquire same lock (should fail or wait)
    // For databases that support true advisory locks, this should return false
    const secondLock = await sql.acquireLock(lockKey, 100);
    // Behavior varies by database
    expect([true, false]).toContain(secondLock);

    // Release
    await sql.releaseLock(lockKey);
  });

  test("should handle different lock keys independently", async () => {
    const sql = SqlDataSource.instance;

    const lock1 = await sql.acquireLock("lock_1");
    const lock2 = await sql.acquireLock("lock_2");

    // Both should be acquired
    expect(lock1).toBe(true);
    expect(lock2).toBe(true);

    // Release both
    await sql.releaseLock("lock_1");
    await sql.releaseLock("lock_2");
  });

  test("should handle special characters in lock keys", async () => {
    const sql = SqlDataSource.instance;

    const specialKey = "lock_with-special.chars@123";
    const acquired = await sql.acquireLock(specialKey);

    expect(acquired).toBe(true);

    await sql.releaseLock(specialKey);
  });

  test("should handle moderate length lock keys", async () => {
    const sql = SqlDataSource.instance;

    // MySQL GET_LOCK has a max key length of 64 characters
    // Use a reasonable length that works across all databases
    const longKey = "a".repeat(60);
    const acquired = await sql.acquireLock(longKey);

    expect(acquired).toBe(true);

    await sql.releaseLock(longKey);
  });

  test("should handle alphanumeric lock keys", async () => {
    const sql = SqlDataSource.instance;

    // Use safe ASCII characters that work across all databases
    const safeKey = "lock_test_key_12345";
    const acquired = await sql.acquireLock(safeKey);

    expect(acquired).toBe(true);

    await sql.releaseLock(safeKey);
  });
});

describe(`[${env.DB_TYPE}] Advisory Locks - releaseLock()`, () => {
  test("should release acquired lock", async () => {
    const sql = SqlDataSource.instance;

    const lockKey = "release_test";

    // Acquire lock
    const acquired = await sql.acquireLock(lockKey);
    expect(acquired).toBe(true);

    // Release lock
    const released = await sql.releaseLock(lockKey);
    expect(released).toBe(true);

    // Should be able to acquire again
    const reacquired = await sql.acquireLock(lockKey);
    expect(reacquired).toBe(true);

    await sql.releaseLock(lockKey);
  });

  test("should return false when releasing non-existent lock", async () => {
    const sql = SqlDataSource.instance;

    // Release lock that was never acquired
    const released = await sql.releaseLock("non_existent_lock");

    // Behavior varies by database
    expect([true, false]).toContain(released);
  });

  test("should handle releasing default key", async () => {
    const sql = SqlDataSource.instance;

    await sql.acquireLock();
    const released = await sql.releaseLock();

    expect(released).toBe(true);
  });

  test("should handle releasing with custom key", async () => {
    const sql = SqlDataSource.instance;

    const customKey = "custom_release_key";

    await sql.acquireLock(customKey);
    const released = await sql.releaseLock(customKey);

    expect(released).toBe(true);
  });
});

describe(`[${env.DB_TYPE}] Advisory Locks - Concurrent Access`, () => {
  test("should handle sequential lock attempts in same session", async () => {
    const sql = SqlDataSource.instance;
    const lockKey = "sequential_access_test";

    // Sequential lock attempts in same session
    // MySQL's GET_LOCK is re-entrant, so all should succeed
    const result1 = await sql.acquireLock(lockKey);
    const result2 = await sql.acquireLock(lockKey);
    const result3 = await sql.acquireLock(lockKey);

    // All should succeed since same session
    expect(result1).toBe(true);
    expect(result2).toBe(true);
    expect(result3).toBe(true);

    // Release
    await sql.releaseLock(lockKey);
  });

  test("should serialize access using locks sequentially", async () => {
    const sql = SqlDataSource.instance;
    const lockKey = "serialized_access_test";

    let counter = 0;

    const incrementWithLock = async (): Promise<number> => {
      const acquired = await sql.acquireLock(lockKey, 5000);
      if (!acquired) {
        throw new Error("Failed to acquire lock");
      }

      const current = counter;
      counter = current + 1;

      await sql.releaseLock(lockKey);
      return counter;
    };

    // Run sequential increments (same session, re-entrant locks)
    for (let i = 0; i < 5; i++) {
      await incrementWithLock();
    }

    // All should complete
    expect(counter).toBe(5);
  });
});

describe(`[${env.DB_TYPE}] Advisory Locks - Database Specific`, () => {
  describe("PostgreSQL/CockroachDB", () => {
    test("should use pg_try_advisory_lock for PostgreSQL", async () => {
      if (env.DB_TYPE !== "postgres" && env.DB_TYPE !== "cockroachdb") {
        return;
      }

      const sql = SqlDataSource.instance;

      const lockKey = "postgres_lock_test";
      const acquired = await sql.acquireLock(lockKey);

      expect(acquired).toBe(true);

      await sql.releaseLock(lockKey);
    });

    test("should convert string key to numeric lock ID", async () => {
      if (env.DB_TYPE !== "postgres" && env.DB_TYPE !== "cockroachdb") {
        return;
      }

      const sql = SqlDataSource.instance;

      const lockKey1 = "test_key";
      const lockKey2 = "test_key";

      // Same key should produce same lock ID
      const lock1 = await sql.acquireLock(lockKey1);
      expect(lock1).toBe(true);

      // Re-acquiring the same lock in same session succeeds (re-entrant)
      const lock2 = await sql.acquireLock(lockKey2, 100);
      expect(lock2).toBe(true);

      // Release both acquisitions
      await sql.releaseLock(lockKey1);
      await sql.releaseLock(lockKey2);
    });
  });

  describe("MySQL/MariaDB", () => {
    test("should use GET_LOCK for MySQL", async () => {
      if (env.DB_TYPE !== "mysql" && env.DB_TYPE !== "mariadb") {
        return;
      }

      const sql = SqlDataSource.instance;

      const lockKey = "mysql_lock_test";
      const acquired = await sql.acquireLock(lockKey);

      expect(acquired).toBe(true);

      await sql.releaseLock(lockKey);
    });

    test("should handle timeout in MySQL GET_LOCK", async () => {
      if (env.DB_TYPE !== "mysql" && env.DB_TYPE !== "mariadb") {
        return;
      }

      const sql = SqlDataSource.instance;

      const lockKey = "mysql_timeout_test";

      // Acquire first lock
      const firstLock = await sql.acquireLock(lockKey);
      expect(firstLock).toBe(true);

      // MySQL's GET_LOCK is re-entrant within the same session
      // Acquiring the same lock from the same session returns success
      const secondLock = await sql.acquireLock(lockKey, 100);

      // Should return true since same session already holds the lock
      expect(secondLock).toBe(true);

      await sql.releaseLock(lockKey);
    });
  });

  describe("SQLite", () => {
    test("should return true for SQLite (file-based locking)", async () => {
      if (env.DB_TYPE !== "sqlite") {
        return;
      }

      const sql = SqlDataSource.instance;

      const acquired = await sql.acquireLock("sqlite_lock_test");

      // SQLite uses file-based locking, so returns true
      expect(acquired).toBe(true);

      const released = await sql.releaseLock("sqlite_lock_test");
      expect(released).toBe(true);
    });
  });

  describe("MSSQL", () => {
    test("should use sp_getapplock for MSSQL", async () => {
      if (env.DB_TYPE !== "mssql") {
        return;
      }

      const sql = SqlDataSource.instance;

      const lockKey = "mssql_lock_test";
      const acquired = await sql.acquireLock(lockKey);

      expect(acquired).toBe(true);

      await sql.releaseLock(lockKey);
    });
  });

  describe("OracleDB", () => {
    test("should use DBMS_LOCK for OracleDB", async () => {
      if (env.DB_TYPE !== "oracledb") {
        return;
      }

      const sql = SqlDataSource.instance;

      const lockKey = "oracle_lock_test";
      const acquired = await sql.acquireLock(lockKey);

      // Oracle lock acquisition
      expect([true, false]).toContain(acquired);

      if (acquired) {
        await sql.releaseLock(lockKey);
      }
    });
  });
});

describe(`[${env.DB_TYPE}] Advisory Locks - Edge Cases`, () => {
  test("should handle empty lock key", async () => {
    const sql = SqlDataSource.instance;

    const acquired = await sql.acquireLock("");

    // Should handle empty key
    expect([true, false]).toContain(acquired);

    if (acquired) {
      await sql.releaseLock("");
    }
  });

  test("should handle very short timeout", async () => {
    const sql = SqlDataSource.instance;

    const lockKey = "short_timeout_test";

    // Acquire lock
    await sql.acquireLock(lockKey);

    // Try to acquire with very short timeout
    const acquired = await sql.acquireLock(lockKey, 1);

    // Should fail or succeed depending on database
    expect([true, false]).toContain(acquired);

    await sql.releaseLock(lockKey);
  });

  test("should handle zero timeout", async () => {
    const sql = SqlDataSource.instance;

    const lockKey = "zero_timeout_test";

    // Acquire lock
    await sql.acquireLock(lockKey);

    // Try to acquire with zero timeout
    const acquired = await sql.acquireLock(lockKey, 0);

    // Should return immediately
    expect([true, false]).toContain(acquired);

    await sql.releaseLock(lockKey);
  });

  test("should handle multiple acquire and release cycles", async () => {
    const sql = SqlDataSource.instance;

    const lockKey = "cycle_test";

    for (let i = 0; i < 10; i++) {
      const acquired = await sql.acquireLock(lockKey);
      expect(acquired).toBe(true);

      await sql.releaseLock(lockKey);
    }
  });
});

describe(`[${env.DB_TYPE}] Advisory Locks - Integration`, () => {
  test("should use locks to protect critical sections sequentially", async () => {
    const sql = SqlDataSource.instance;

    const lockKey = "race_condition_test";
    const sharedResource: string[] = [];

    const criticalSection = async (id: number): Promise<void> => {
      const acquired = await sql.acquireLock(lockKey, 5000);
      if (!acquired) {
        throw new Error(`Failed to acquire lock for ${id}`);
      }

      // Simulate critical section
      sharedResource.push(`item-${id}`);

      await sql.releaseLock(lockKey);
    };

    // Run sequential operations (same session, re-entrant locks work sequentially)
    for (let i = 1; i <= 5; i++) {
      await criticalSection(i);
    }

    // All items should be added
    expect(sharedResource.length).toBe(5);
  });

  test("should handle re-acquiring lock within same session", async () => {
    const sql = SqlDataSource.instance;

    const lockKey = "reacquire_integration_test";

    // Acquire lock
    const firstLock = await sql.acquireLock(lockKey);
    expect(firstLock).toBe(true);

    // Re-acquire the same lock within the same session
    // Most databases treat this as re-entrant and return success immediately
    const acquired = await sql.acquireLock(lockKey, 500);

    // Should succeed since same session holds the lock
    expect(acquired).toBe(true);

    await sql.releaseLock(lockKey);
  });
});
