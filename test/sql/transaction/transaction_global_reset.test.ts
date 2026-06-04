import { env } from "../../../src/env/env";
import { HysteriaError } from "../../../src/errors/hysteria_error";
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
        // The injected failure skips releaseConnection, so the pool still holds
        // the cloned connection. Release it manually so the test does not leak
        // and afterAll disconnect does not hang waiting on pool.end().
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

  testSkipSQLite(
    "F010: commit() rejects when releaseConnection() throws",
    async () => {
      const trx = await sql.transaction();
      await sql
        .from(UserWithoutPk)
        .insert({ ...UserFactory.getCommonUserData() }, { trx });

      // Verify the F010 contract: errors from releaseConnection must propagate
      // UP to the commit() caller. We patch the per-dialect release() to throw
      // (which is what F010 actually protects against) and ensure the cloned
      // connection is still returned to the pool so the test does not leak.
      const trxSql = trx.sql as SqlDataSource;
      const conn = trxSql.sqlConnection as any;
      const original = conn.release;
      conn.release = () => {
        // Mark connection as already released to the pool (mimic successful release)
        // to keep the pool consistent, then throw to simulate a release error.
        try {
          original?.call(conn);
        } catch {
          // ignore; we are simulating failure
        }
        throw new HysteriaError("RELEASE_FAIL", "DEVELOPMENT_ERROR");
      };

      try {
        await expect(trx.commit()).rejects.toThrow("RELEASE_FAIL");
      } finally {
        conn.release = original;
      }
    },
  );
});
