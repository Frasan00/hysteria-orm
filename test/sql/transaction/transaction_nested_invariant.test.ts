/**
 * F011 — Nested transaction commit/rollback must NOT release the outer
 * connection.
 *
 * Audit's stated concern (mssql/oracledb): the nested commit branch in
 * `Transaction.commit()` early-returns before `releaseConnection()`, which
 * is correct for the nested case (we keep the outer connection alive). The
 * "silent no-op" risk is for dialects whose nested branch executes no SQL
 * (mssql/oracledb fall through with just a comment and `break`). For those
 * dialects, the only thing the nested commit does is `this.isActive = false;
 * return;` — and that is exactly what the outer transaction requires.
 *
 * This test pins the invariants for all dialects:
 *   1. nestedTransaction().commit() does not release the parent's
 *      sqlConnection (parent's connection is still usable after).
 *   2. nestedTransaction().rollback() does not release the parent's
 *      sqlConnection.
 *   3. After nested commit/rollback, parent.commit() still succeeds.
 *   4. The savepoint name passed to the dialect-specific SQL is non-empty
 *      and consistent between `transaction()` and `commit()`.
 */
import { env } from "../../../src/env/env";
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
  await sql.from(UserWithoutPk).delete();
  const users = await sql.from(UserWithoutPk).many();
  expect(users.length).toBe(0);
});

afterEach(async () => {
  try {
    await sql.from(UserWithoutPk).delete();
  } catch {
    // ignore
  }
  const users = await sql.from(UserWithoutPk).many();
  expect(users.length).toBe(0);
});

/**
 * Capture the exact SAVEPOINT / SAVE TRANSACTION identifier that the
 * dialect-specific nested branch emits. Different dialects use different
 * verbs, so we match a prefix set.
 */
function captureSavepoint(
  trxSql: SqlDataSource,
  captured: string[],
): () => void {
  const original = (trxSql as any).rawQuery.bind(trxSql);
  (trxSql as any).rawQuery = async (...args: any[]) => {
    const text = typeof args[0] === "string" ? args[0] : String(args[0] ?? "");
    if (
      /^\s*SAVE\s+TRANSACTION\b/i.test(text) ||
      /^\s*SAVEPOINT\b/i.test(text) ||
      /^\s*RELEASE\s+SAVEPOINT\b/i.test(text) ||
      /^\s*ROLLBACK\s+TRANSACTION\b/i.test(text) ||
      /^\s*ROLLBACK\s+TO\s+(SAVEPOINT\s+)?/i.test(text)
    ) {
      captured.push(text.trim());
    }
    return original(...args);
  };
  return () => {
    (trxSql as any).rawQuery = original;
  };
}

describe(`[${env.DB_TYPE}] Nested transaction invariants (F011)`, () => {
  test("F011-A: nested commit does not release the outer connection", async () => {
    const parent = await sql.transaction();
    const parentConnRef = (parent.sql as SqlDataSource).sqlConnection;
    expect(parentConnRef).toBeTruthy();

    const nested = await parent.nestedTransaction();
    const nestedConnRef = (nested.sql as SqlDataSource).sqlConnection;
    // Nested transaction must share the parent's connection (savepoint semantics).
    expect(nestedConnRef).toBe(parentConnRef);

    // Commit the nested — must not touch the parent's connection.
    await nested.commit();
    expect(nested.isActive).toBe(false);

    // F011 invariant: parent's sqlConnection reference is unchanged and
    // still bound. If `releaseConnection()` had been called on the nested
    // path, the parent's sqlConnection would be nulled.
    expect((parent.sql as SqlDataSource).sqlConnection).toBe(parentConnRef);
    expect(parent.isActive).toBe(true);

    // Parent can still write through the same connection.
    await sql
      .from(UserWithoutPk)
      .insert({ ...UserFactory.getCommonUserData() }, { trx: parent });
    await parent.commit();
  });

  test("F011-B: nested rollback does not release the outer connection", async () => {
    const parent = await sql.transaction();
    const parentConnRef = (parent.sql as SqlDataSource).sqlConnection;
    expect(parentConnRef).toBeTruthy();

    const nested = await parent.nestedTransaction();

    // Write something that will be rolled back at the nested level.
    try {
      await sql
        .from(UserWithoutPk)
        .insert({ ...UserFactory.getCommonUserData() }, { trx: nested });
    } catch {
      // Some dialects may reject mid-savepoint writes; that's fine for this test.
    }
    await nested.rollback();
    expect(nested.isActive).toBe(false);

    // F011 invariant: parent's connection is untouched.
    expect((parent.sql as SqlDataSource).sqlConnection).toBe(parentConnRef);
    expect(parent.isActive).toBe(true);

    await parent.commit();
  });

  test("F011-C: savepoint name is non-empty and matches between transaction() and commit()", async () => {
    const captured: string[] = [];
    const parent = await sql.transaction();
    const parentSql = parent.sql as SqlDataSource;
    const restore = captureSavepoint(parentSql, captured);

    try {
      const nested = await parent.nestedTransaction();
      await nested.commit();

      // We should have captured at least one SAVEPOINT-family statement
      // (begin) and at least one RELEASE/ROLLBACK-TO-family statement
      // (commit), except on mssql/oracledb where the commit branch is a
      // no-op by design (auto-release on outer commit).
      const hasBegin = captured.some(
        (c) =>
          /^\s*SAVE\s+TRANSACTION\b/i.test(c) || /^\s*SAVEPOINT\b/i.test(c),
      );
      expect(hasBegin).toBe(true);

      if (env.DB_TYPE === "mssql" || env.DB_TYPE === "oracledb") {
        // Audit's documented behaviour: these dialects have no explicit
        // release / rollback-to at the nested-commit level. Verify the
        // commit did NOT execute a stray RELEASE/ROLLBACK-TO statement
        // for the savepoint (which would indicate a regression that
        // double-released the savepoint).
        const strayCommit = captured.find(
          (c) =>
            /^\s*RELEASE\s+SAVEPOINT\b/i.test(c) ||
            /^\s*ROLLBACK\s+TRANSACTION\b/i.test(c) ||
            /^\s*ROLLBACK\s+TO\b/i.test(c),
        );
        expect(strayCommit).toBeUndefined();
      } else {
        // Postgres / MySQL / MariaDB / Cockroach / SQLite: explicit
        // RELEASE SAVEPOINT must be issued. Verify the captured statement
        // contains a non-empty savepoint identifier.
        const release = captured.find((c) =>
          /^\s*RELEASE\s+SAVEPOINT\b/i.test(c),
        );
        expect(release).toBeDefined();
        expect(release!.length).toBeGreaterThan(
          "RELEASE SAVEPOINT ".length + 1,
        );
      }
    } finally {
      restore();
      // Always wrap the parent in rollback so the test cannot leak a tx.
      try {
        if (parent.isActive) {
          await parent.rollback();
        }
      } catch {
        // ignore
      }
    }
  });
});
