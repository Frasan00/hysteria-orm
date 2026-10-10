import { env } from "../../../src/env/env";
import { HysteriaError } from "../../../src/errors/hysteria_error";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import type { Transaction } from "../../../src/sql/transactions/transaction";
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
  const users = await sql.from(UserWithoutPk).many();
  expect(users.length).toBe(0);
  await sql.from(UserWithoutPk).delete();
});

afterEach(async () => {
  // Defensive cleanup: ensure no global trx is left dangling between tests
  try {
    await sql.rollbackGlobalTransaction();
  } catch {
    // ignore
  }
  try {
    await sql.from(UserWithoutPk).delete();
  } catch {
    // ignore
  }
  const users = await sql.from(UserWithoutPk).many();
  expect(users.length).toBe(0);
});

describe(`[${env.DB_TYPE}] Global transaction reset on failure (F007)`, () => {
  const testSkipSQLite = env.DB_TYPE === "sqlite" ? test.skip : test;

  testSkipSQLite(
    "F007-A: rollback failure still clears global transaction reference",
    async () => {
      const trx = await sql.startGlobalTransaction();
      expect(sql.isInGlobalTransaction).toBe(true);

      const orig = trx.rollback.bind(trx);
      (trx as any).rollback = async () => {
        throw new HysteriaError("ROLLBACK_FAIL", "DEVELOPMENT_ERROR");
      };

      try {
        await expect(sql.rollbackGlobalTransaction()).rejects.toThrow(
          "ROLLBACK_FAIL",
        );
        expect(sql.isInGlobalTransaction).toBe(false);
      } finally {
        (trx as any).rollback = orig;
        // The injected failure bypasses rollback() entirely, so no ROLLBACK reached the
        // server and the transaction is still open on that connection. End it before the
        // connection returns to the pool, or the next test that reserves it starts with a
        // transaction already in progress. Postgres only warns about that, CockroachDB
        // errors, which is why this only shows there.
        try {
          await (trx.sql as SqlDataSource).rawQuery("ROLLBACK");
        } catch {
          // ignore
        }
        try {
          await (trx.sql as SqlDataSource).disconnect();
        } catch {
          // ignore
        }
      }
    },
  );

  testSkipSQLite(
    "F007-B: commit failure still clears global transaction reference",
    async () => {
      const trx = await sql.startGlobalTransaction();
      expect(sql.isInGlobalTransaction).toBe(true);

      const orig = trx.commit.bind(trx);
      (trx as any).commit = async () => {
        throw new HysteriaError("COMMIT_FAIL", "DEVELOPMENT_ERROR");
      };

      try {
        await expect(sql.commitGlobalTransaction()).rejects.toThrow(
          "COMMIT_FAIL",
        );
        expect(sql.isInGlobalTransaction).toBe(false);
      } finally {
        (trx as any).commit = orig;
        // Same as F007-A: no COMMIT reached the server, so end the transaction before the
        // connection goes back to the pool.
        try {
          await (trx.sql as SqlDataSource).rawQuery("ROLLBACK");
        } catch {
          // ignore
        }
        try {
          await (trx.sql as SqlDataSource).disconnect();
        } catch {
          // ignore
        }
      }
    },
  );
});

describe(`[${env.DB_TYPE}] release() failure surfaces to caller (F010)`, () => {
  const testSkipSQLite = env.DB_TYPE === "sqlite" ? test.skip : test;

  /**
   * Injects a release failure at the adapter, which is the level F010's contract is about:
   * an error from `releaseConnection` has to reach the `commit()`/`rollback()` caller.
   * Patching the driver's own release method instead would be pg-shaped: mssql's reserved
   * object is a `Transaction` whose `release(connection)` is a pool callback the library
   * never calls, so the injection would silently never fire there.
   */
  const installReleaseFailure = (trx: Transaction) => {
    const adapter = (trx.sql as SqlDataSource).driverAdapter as any;
    const original = adapter.releaseConnection.bind(adapter);

    adapter.releaseConnection = (...args: any[]) => {
      // Release for real first, so the pool stays consistent and afterAll can close it,
      // then throw.
      const released = original(...args);
      if (released && typeof released.then === "function") {
        return released.then(() => {
          throw new HysteriaError("RELEASE_FAIL", "DEVELOPMENT_ERROR");
        });
      }
      throw new HysteriaError("RELEASE_FAIL", "DEVELOPMENT_ERROR");
    };

    return () => {
      adapter.releaseConnection = original;
    };
  };

  test("F010: commit() rejects when releaseConnection() throws", async () => {
    const trx = await sql.transaction();
    await sql
      .from(UserWithoutPk)
      .insert({ ...UserFactory.getCommonUserData() }, { trx });

    const restore = installReleaseFailure(trx);

    try {
      await expect(trx.commit()).rejects.toThrow("RELEASE_FAIL");
      // A throwing release must not leave the transaction reporting itself active.
      expect(trx.isActive).toBe(false);
    } finally {
      restore();
    }
  });

  test("F010: rollback() rejects when releaseConnection() throws and still clears isActive", async () => {
    const trx = await sql.transaction();
    await sql
      .from(UserWithoutPk)
      .insert({ ...UserFactory.getCommonUserData() }, { trx });

    const restore = installReleaseFailure(trx);

    try {
      await expect(trx.rollback()).rejects.toThrow("RELEASE_FAIL");
      expect(trx.isActive).toBe(false);
    } finally {
      restore();
    }
  });
});
