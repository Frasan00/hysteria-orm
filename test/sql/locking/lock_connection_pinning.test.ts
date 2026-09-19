/**
 * Regression: `pg_try_advisory_lock` is session-scoped, but acquireLock/releaseLock
 * used to run through the pool, so acquire and release could land on different
 * backends — the unlock then ran on a session holding nothing and the lock leaked,
 * making every later acquireLock for that key return false.
 *
 * Under Bun.sql this reproduces reliably because a transaction rotates the pooled
 * connection; under node-pg it depends on which idle client the pool hands out.
 */

import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";

const supportsSessionLocks =
  env.DB_TYPE === "postgres" || env.DB_TYPE === "cockroachdb";

(supportsSessionLocks ? describe : describe.skip)(
  `[${env.DB_TYPE}] advisory lock connection pinning`,
  () => {
    let sql: SqlDataSource;

    beforeAll(async () => {
      sql = new SqlDataSource();
      await sql.connect();
    });

    afterAll(async () => {
      if (sql?.isConnected) {
        await sql.disconnect();
      }
    });

    test("survives a transaction between acquire and release", async () => {
      const key = `pinning_regression_${env.DB_TYPE}`;

      expect(await sql.acquireLock(key)).toBe(true);

      // The trigger: a transaction pins and then releases its own connection.
      const trx = await sql.transaction();
      await trx.commit();

      expect(await sql.releaseLock(key)).toBe(true);

      // The real assertion — the lock is gone, so it can be taken again. If the
      // lock leaked, this returns false and every later acquire fails forever.
      expect(await sql.acquireLock(key)).toBe(true);
      expect(await sql.releaseLock(key)).toBe(true);
    });

    test("can be re-acquired repeatedly across transactions", async () => {
      const key = `pinning_loop_${env.DB_TYPE}`;

      for (let i = 0; i < 3; i++) {
        expect(await sql.acquireLock(key)).toBe(true);
        const trx = await sql.transaction();
        await trx.commit();
        expect(await sql.releaseLock(key)).toBe(true);
      }
    });

    test("two data sources contend for the same key", async () => {
      const key = `pinning_contend_${env.DB_TYPE}`;
      const second = new SqlDataSource();
      await second.connect();

      expect(await sql.acquireLock(key)).toBe(true);
      // A different data source (different session) must not get the lock.
      expect(await second.acquireLock(key)).toBe(false);

      expect(await sql.releaseLock(key)).toBe(true);
      expect(await second.acquireLock(key)).toBe(true);
      expect(await second.releaseLock(key)).toBe(true);

      await second.disconnect();
    });
  },
);
