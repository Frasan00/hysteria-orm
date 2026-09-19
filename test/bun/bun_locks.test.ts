/// <reference types="bun-types" />
/**
 * Bun.sql-specific regression: `acquireLock`/`releaseLock` leaked the lock.
 *
 * `pg_try_advisory_lock` is session-scoped, but both calls went through the pool.
 * Under Bun.sql a transaction rotates the pooled connection, so the unlock ran on a
 * different backend than the acquire and the lock stayed held — every later
 * acquireLock for that key then returned false for the life of the process.
 *
 * The fix pins one dedicated session for locks, so acquire and release share a
 * backend regardless of transaction activity.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { SqlDataSource } from "../../src/sql/sql_data_source";

type RawPg = { rows: Array<Record<string, unknown>>; rowCount: number };

let sql: SqlDataSource;
let reachable = false;

beforeAll(async () => {
  sql = new SqlDataSource({
    type: "postgres",
    host: process.env.DB_HOST || "postgres",
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_DATABASE || "test",
    logs: false,
  });
  try {
    await sql.connect();
    reachable = true;
  } catch {
    reachable = false;
  }
});

afterAll(async () => {
  if (reachable && sql?.isConnected) {
    await sql.disconnect();
  }
});

describe("bun-sql advisory lock lifecycle", () => {
  it("does not leak when a transaction runs between acquire and release", async () => {
    if (!reachable) {
      return;
    }

    const key = "bun_leak_repro";
    expect(await sql.acquireLock(key)).toBe(true);

    // The trigger: a transaction pins its own connection, and under bun-sql the
    // pooled connection used by the lock is rotated as a result.
    const trx = await sql.transaction();
    await trx.commit();

    expect(await sql.releaseLock(key)).toBe(true);

    // The real assertion — the lock is gone, so it can be taken again. Before the
    // fix this returned false and every subsequent acquire failed.
    expect(await sql.acquireLock(key)).toBe(true);
    expect(await sql.releaseLock(key)).toBe(true);
  });

  it("leaves no advisory lock lingering in pg_locks", async () => {
    if (!reachable) {
      return;
    }

    const key = "bun_lingering_probe";
    expect(await sql.acquireLock(key)).toBe(true);
    expect(await sql.releaseLock(key)).toBe(true);

    const raw = (await sql.rawQuery(
      `select count(*)::int as n from pg_locks where locktype = 'advisory' and granted`,
    )) as RawPg;

    expect(Number(raw.rows[0].n)).toBe(0);
  });

  it("holds the lock on one session across a transaction", async () => {
    if (!reachable) {
      return;
    }

    const key = "bun_pid_probe";
    expect(await sql.acquireLock(key)).toBe(true);

    // The lock's owning backend must stay stable despite the transaction below.
    const before = (await sql.rawQuery(
      `select pid from pg_locks where locktype = 'advisory' and granted limit 1`,
    )) as RawPg;

    const trx = await sql.transaction();
    await trx.commit();

    const after = (await sql.rawQuery(
      `select pid from pg_locks where locktype = 'advisory' and granted limit 1`,
    )) as RawPg;

    expect(after.rows[0].pid).toBe(before.rows[0].pid);

    expect(await sql.releaseLock(key)).toBe(true);
  });
});
