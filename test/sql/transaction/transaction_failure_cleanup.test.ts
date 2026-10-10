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

  testSkipSQLite(
    "commit failure forwards the error to releaseConnection",
    async () => {
      const trx = await sql.transaction();
      await sql
        .from(UserWithoutPk)
        .insert({ ...UserFactory.getCommonUserData() }, { trx });

      const adapter = (trx.sql as SqlDataSource).driverAdapter!;
      const releaseSpy = jest.spyOn(adapter, "releaseConnection");

      const original: any = {};
      const restore = installCommitFailure(trx as any, original);

      try {
        await expect(trx.commit()).rejects.toThrow("TRANSACTION_NOT_ACTIVE");
      } finally {
        restore();
      }

      // The driver needs the failure to know the session is unusable.
      try {
        expect(releaseSpy).toHaveBeenCalledTimes(1);
        expect(releaseSpy.mock.calls[0][1]).toBeInstanceOf(Error);
      } finally {
        releaseSpy.mockRestore();
      }
    },
  );

  testSkipSQLite(
    "rollback failure forwards the error to releaseConnection",
    async () => {
      const trx = await sql.transaction();
      await sql
        .from(UserWithoutPk)
        .insert({ ...UserFactory.getCommonUserData() }, { trx });

      const adapter = (trx.sql as SqlDataSource).driverAdapter!;
      const releaseSpy = jest.spyOn(adapter, "releaseConnection");

      const original: any = {};
      const restore = installRollbackFailure(trx as any, original);

      try {
        await expect(trx.rollback()).rejects.toThrow("TRANSACTION_NOT_ACTIVE");
      } finally {
        restore();
      }

      try {
        expect(releaseSpy).toHaveBeenCalledTimes(1);
        expect(releaseSpy.mock.calls[0][1]).toBeInstanceOf(Error);
      } finally {
        releaseSpy.mockRestore();
      }
    },
  );
});

/**
 * Makes `beginTransaction` reject on the shared adapter. Skipped on sqlite: its
 * `clone()` builds a private adapter, so patching the shared one cannot reach the
 * transaction, and a stranded sqlite handle is not observable anyway.
 */
function installBeginFailure(): () => void {
  const adapter = sql.driverAdapter!;
  const original = adapter.beginTransaction;

  adapter.beginTransaction = () =>
    Promise.reject(
      new HysteriaError("FORCED_BEGIN_FAILURE", "TRANSACTION_NOT_ACTIVE"),
    );

  return () => {
    adapter.beginTransaction = original;
  };
}

describe(`[${env.DB_TYPE}] Callback error survives a rollback failure`, () => {
  /**
   * Patches the adapter class rather than the instance: a sqlite transaction builds a
   * private adapter, so an instance patch on the shared one would not reach it.
   */
  const installAdapterRollbackFailure = (): (() => void) => {
    const prototype = Object.getPrototypeOf(sql.driverAdapter!);
    const original = prototype.rollbackTransaction;

    prototype.rollbackTransaction = () =>
      Promise.reject(
        new HysteriaError("FORCED_ROLLBACK_FAILURE", "TRANSACTION_NOT_ACTIVE"),
      );

    return () => {
      prototype.rollbackTransaction = original;
    };
  };

  test("the callback error is thrown, not the rollback error", async () => {
    const restore = installAdapterRollbackFailure();

    try {
      await expect(
        sql.transaction(async (trx) => {
          await sql
            .from(UserWithoutPk)
            .insert({ ...UserFactory.getCommonUserData() }, { trx });

          throw new Error("callback blew up");
        }),
      ).rejects.toThrow("callback blew up");
    } finally {
      restore();
    }
  });
});

describe(`[${env.DB_TYPE}] BEGIN failure cleanup (F012)`, () => {
  const testSkipSQLite = env.DB_TYPE === "sqlite" ? test.skip : test;

  testSkipSQLite(
    "a failed BEGIN releases the reserved connection",
    async () => {
      const adapter = sql.driverAdapter!;
      const releaseSpy = jest.spyOn(adapter, "releaseConnection");
      const restore = installBeginFailure();

      try {
        await expect(sql.transaction()).rejects.toThrow("FORCED_BEGIN_FAILURE");
      } finally {
        restore();
      }

      try {
        expect(releaseSpy).toHaveBeenCalledTimes(1);
        expect(releaseSpy.mock.calls[0][1]).toBeInstanceOf(Error);
      } finally {
        releaseSpy.mockRestore();
      }
    },
  );

  testSkipSQLite("repeated failed BEGINs do not exhaust the pool", async () => {
    const restore = installBeginFailure();

    try {
      // More attempts than the default pool holds (10 on pg, mysql and mssql), so
      // one stranded client per attempt would deadlock the reservation below.
      for (let attempt = 0; attempt < 12; attempt++) {
        await expect(sql.transaction()).rejects.toThrow("FORCED_BEGIN_FAILURE");
      }
    } finally {
      restore();
    }

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
  });

  testSkipSQLite(
    "a failed startGlobalTransaction does not report a live transaction",
    async () => {
      const restore = installBeginFailure();

      try {
        await expect(sql.startGlobalTransaction()).rejects.toThrow(
          "FORCED_BEGIN_FAILURE",
        );
      } finally {
        restore();
      }

      expect(sql.isInGlobalTransaction).toBe(false);
    },
  );

  testSkipSQLite(
    "a failed savepoint leaves the outer transaction and its connection intact",
    async () => {
      const trx = await sql.transaction();
      const trxSql = trx.sql as SqlDataSource;
      const originalRawQuery = trxSql.rawQuery;

      (trxSql as any).rawQuery = async (...args: any[]) => {
        const sqlText =
          typeof args[0] === "string" ? args[0] : String(args[0] ?? "");
        // mssql spells it `SAVE TRANSACTION`, every other dialect `SAVEPOINT`.
        if (/^\s*SAVE\s*(?:POINT|TRANSACTION)\b/i.test(sqlText)) {
          throw new HysteriaError(
            "FORCED_SAVEPOINT_FAILURE",
            "TRANSACTION_NOT_ACTIVE",
          );
        }
        return (originalRawQuery as any).apply(trxSql, args);
      };

      try {
        await expect(trx.nestedTransaction()).rejects.toThrow(
          "FORCED_SAVEPOINT_FAILURE",
        );
      } finally {
        (trxSql as any).rawQuery = originalRawQuery;
      }

      // The savepoint shares the outer connection, so releasing it would have
      // taken the outer transaction down with it.
      expect(trxSql.sqlConnection).not.toBeNull();

      await sql
        .from(UserWithoutPk)
        .insert({ ...UserFactory.getCommonUserData() }, { trx });
      await trx.rollback();

      const rows = await sql.from(UserWithoutPk).many();
      expect(rows).toHaveLength(0);
    },
  );
});
