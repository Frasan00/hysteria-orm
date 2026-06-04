import { env } from "../../../src/env/env";
import { HysteriaError } from "../../../src/errors/hysteria_error";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserWithUuid } from "../test_models/uuid/schema";

let sql: SqlDataSource;

const isSqlite = env.DB_TYPE === "sqlite";
const isMssql = env.DB_TYPE === "mssql";

beforeAll(async () => {
  sql = new SqlDataSource();
  await sql.connect();
});

afterAll(async () => {
  await sql.disconnect();
});

describe(`[${env.DB_TYPE}] Global Transaction Concurrency - F005`, () => {
  beforeEach(async () => {
    if (!isSqlite) {
      await sql.startGlobalTransaction();
    }
  });

  afterEach(async () => {
    if (!isSqlite) {
      await sql.rollbackGlobalTransaction({
        throwErrorOnInactiveTransaction: false,
      });
    } else {
      try {
        await sql.from(UserWithUuid).delete();
      } catch {
        // ignore
      }
    }
  });

  test(`concurrent startGlobalTransaction rejects second caller`, async () => {
    if (isSqlite) {
      return;
    }

    // The outer beforeEach started a global transaction. We need a clean
    // slate so the test owns the global transaction state. Commit it (no
    // rows were inserted) so the afterEach rollback is a no-op.
    await sql.commitGlobalTransaction();

    // Fire two startGlobalTransaction calls without awaiting between them.
    // The first one is allowed to proceed; the second must reject with
    // HysteriaError containing GLOBAL_TRANSACTION_ALREADY_STARTED.
    const first = sql.startGlobalTransaction();
    const second = sql.startGlobalTransaction();

    const [r1, r2] = await Promise.allSettled([first, second]);

    // The first should resolve to a Transaction.
    expect(r1.status).toBe("fulfilled");
    // The second should reject.
    expect(r2.status).toBe("rejected");

    if (r2.status === "rejected") {
      const err = r2.reason as HysteriaError;
      expect(err).toBeInstanceOf(HysteriaError);
      expect(err.code).toBe("GLOBAL_TRANSACTION_ALREADY_STARTED");
      expect(String(err.message)).toContain(
        "GLOBAL_TRANSACTION_ALREADY_STARTED",
      );
    }

    // Cleanup: rollback whichever transaction is still active. With the
    // fix, only the first caller's transaction is still active. Without
    // the fix, the second caller's was created on top of the first.
    await sql.rollbackGlobalTransaction({
      throwErrorOnInactiveTransaction: false,
    });
  }, 20000);
});

describe(`[${env.DB_TYPE}] Clone - Disconnect With Borrowed Connection - F002`, () => {
  beforeEach(async () => {
    if (!isSqlite) {
      await sql.startGlobalTransaction();
    }
  });

  afterEach(async () => {
    if (!isSqlite) {
      await sql.rollbackGlobalTransaction({
        throwErrorOnInactiveTransaction: false,
      });
    } else {
      try {
        await sql.from(UserWithUuid).delete();
      } catch {
        // ignore
      }
    }
  });

  test(`disconnect of shared-pool clone releases borrowed connection`, async () => {
    if (isSqlite || isMssql) {
      return;
    }

    const pool = sql.getPool() as any;
    // Driver-specific pool internals. We use best-effort detection.
    // For pg, totalCount counts allocated clients (does not change on
    // release back to pool). idleCount counts clients available in the
    // pool right now. So a borrow increments totalCount and decrements
    // idleCount; a release back to pool decrements totalCount stays
    // (client stays) and increments idleCount.
    const readPoolCounters = (): {
      total: number;
      idle: number;
      active: number;
    } => {
      // pg / cockroachdb
      if (typeof pool.totalCount === "number") {
        return {
          total: pool.totalCount,
          idle: pool.idleCount ?? 0,
          active: (pool.totalCount ?? 0) - (pool.idleCount ?? 0),
        };
      }
      // mysql2 / mariadb
      if (Array.isArray(pool._allConnections)) {
        const free = Array.isArray(pool._freeConnections)
          ? pool._freeConnections.length
          : 0;
        return {
          total: pool._allConnections.length,
          idle: free,
          active: pool._allConnections.length - free,
        };
      }
      return { total: -1, idle: -1, active: -1 };
    };

    const before = readPoolCounters();

    const child = await sql.clone();

    // Defaults: shared pool, child does not own the pool.
    const childAny = child as any;
    expect(childAny.ownsPool).toBe(false);
    expect(childAny.sqlPool).toBe(sql.getPool());

    // Borrow a real connection from the shared pool.
    childAny.sqlConnection = await child.getConnection();
    expect(childAny.sqlConnection).toBeDefined();

    // If the driver exposes pool internals, assert the borrow grew the
    // active count by exactly 1.
    if (before.total >= 0) {
      const afterBorrow = readPoolCounters();
      expect(afterBorrow.active).toBe(before.active + 1);
    }

    // Disconnect the child. With the fix, this returns the borrowed
    // connection to the pool. Without the fix, the connection is leaked.
    await child.disconnect();

    // Let the pool settle.
    await new Promise((r) => setTimeout(r, 50));

    if (before.total >= 0) {
      const afterDisconnect = readPoolCounters();
      // Active count should be back to where it was before the borrow.
      expect(afterDisconnect.active).toBe(before.active);
    }
  }, 20000);
});
