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

afterEach(async () => {
  await sql.from(UserWithoutPk).delete();
  const users = await sql.from(UserWithoutPk).many();
  expect(users.length).toBe(0);
});

/**
 * Patch the code path used by Transaction.commit() to throw a recognizable error.
 * Different dialects go through different paths, so we patch the right one.
 */
function installCommitFailure(
  trx: { sql: SqlDataSource },
  original: { rawQuery?: any; connCommit?: any; conn?: any },
): () => void {
  const trxSql = trx.sql as SqlDataSource;
  const conn = trxSql.sqlConnection as any;

  switch (env.DB_TYPE) {
    case "mssql":
    case "oracledb":
    case "mysql":
    case "mariadb": {
      original.conn = conn;
      original.connCommit = conn.commit;
      conn.commit = async () => {
        throw new HysteriaError(
          "FORCED_COMMIT_FAILURE",
          "TRANSACTION_NOT_ACTIVE",
        );
      };
      return () => {
        if (conn && original.connCommit) conn.commit = original.connCommit;
      };
    }
    case "postgres":
    case "cockroachdb":
    case "sqlite": {
      // These dialects go through sql.rawQuery("COMMIT")
      original.rawQuery = (trxSql as any).rawQuery;
      (trxSql as any).rawQuery = async (...args: any[]) => {
        // Only intercept the COMMIT call; let other queries pass through.
        const sqlText =
          typeof args[0] === "string" ? args[0] : String(args[0] ?? "");
        if (/^\s*COMMIT\b/i.test(sqlText)) {
          throw new HysteriaError(
            "FORCED_COMMIT_FAILURE",
            "TRANSACTION_NOT_ACTIVE",
          );
        }
        return (original.rawQuery as any).apply(trxSql, args);
      };
      return () => {
        if (original.rawQuery) (trxSql as any).rawQuery = original.rawQuery;
      };
    }
    default:
      throw new Error(`Unsupported DB_TYPE: ${env.DB_TYPE}`);
  }
}

function installRollbackFailure(
  trx: { sql: SqlDataSource },
  original: { rawQuery?: any; connRollback?: any; conn?: any },
): () => void {
  const trxSql = trx.sql as SqlDataSource;
  const conn = trxSql.sqlConnection as any;

  switch (env.DB_TYPE) {
    case "mssql":
    case "oracledb":
    case "mysql":
    case "mariadb": {
      original.conn = conn;
      original.connRollback = conn.rollback;
      conn.rollback = async () => {
        throw new HysteriaError(
          "FORCED_ROLLBACK_FAILURE",
          "TRANSACTION_NOT_ACTIVE",
        );
      };
      return () => {
        if (conn && original.connRollback)
          conn.rollback = original.connRollback;
      };
    }
    case "postgres":
    case "cockroachdb":
    case "sqlite": {
      original.rawQuery = (trxSql as any).rawQuery;
      (trxSql as any).rawQuery = async (...args: any[]) => {
        const sqlText =
          typeof args[0] === "string" ? args[0] : String(args[0] ?? "");
        if (/^\s*ROLLBACK\b/i.test(sqlText)) {
          throw new HysteriaError(
            "FORCED_ROLLBACK_FAILURE",
            "TRANSACTION_NOT_ACTIVE",
          );
        }
        return (original.rawQuery as any).apply(trxSql, args);
      };
      return () => {
        if (original.rawQuery) (trxSql as any).rawQuery = original.rawQuery;
      };
    }
    default:
      throw new Error(`Unsupported DB_TYPE: ${env.DB_TYPE}`);
  }
}

describe(`[${env.DB_TYPE}] Transaction failure cleanup (F008/F009)`, () => {
  const testSkipSQLite = env.DB_TYPE === "sqlite" ? test.skip : test;

  testSkipSQLite(
    "commit failure releases connection and clears isActive (F008)",
    async () => {
      const trx = await sql.transaction();
      await sql
        .from(UserWithoutPk)
        .insert({ ...UserFactory.getCommonUserData() }, { trx });

      const original: any = {};
      const restore = installCommitFailure(trx as any, original);

      try {
        await expect(trx.commit()).rejects.toThrow("TRANSACTION_NOT_ACTIVE");

        // F008 invariant: isActive must be false after commit failure
        expect(trx.isActive).toBe(false);
      } finally {
        restore();
      }

      // Pool exhaustion check: subsequent transaction must succeed within 5s
      const nextTrx = await Promise.race([
        sql.transaction(),
        new Promise((_resolve, reject) =>
          setTimeout(
            () =>
              reject(new Error("sql.transaction() timed out (pool exhausted)")),
            5000,
          ),
        ),
      ]);
      await (nextTrx as any).rollback();
    },
  );

  testSkipSQLite(
    "rollback failure releases connection and clears isActive (F009)",
    async () => {
      const trx = await sql.transaction();
      await sql
        .from(UserWithoutPk)
        .insert({ ...UserFactory.getCommonUserData() }, { trx });

      const original: any = {};
      const restore = installRollbackFailure(trx as any, original);

      try {
        await expect(trx.rollback()).rejects.toThrow("TRANSACTION_NOT_ACTIVE");

        // F009 invariant: isActive must be false after rollback failure
        expect(trx.isActive).toBe(false);
      } finally {
        restore();
      }

      // Pool exhaustion check: subsequent transaction must succeed within 5s
      const nextTrx = await Promise.race([
        sql.transaction(),
        new Promise((_resolve, reject) =>
          setTimeout(
            () =>
              reject(new Error("sql.transaction() timed out (pool exhausted)")),
            5000,
          ),
        ),
      ]);
      await (nextTrx as any).rollback();
    },
  );
});
