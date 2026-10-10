/**
 * DB-free. Covers a node-sqlite3 open failure, which the driver reports only through
 * an async callback. Before the adapter awaited that callback, the error was thrown
 * from inside it, where connect()'s try/catch could never see it.
 */

import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { HysteriaError } from "../../../src/errors/hysteria_error";
import { SqlDataSource } from "../../../src/sql/sql_data_source";

describe("sqlite connect failure", () => {
  test("a bad database path rejects connect() and leaves nothing half-built", async () => {
    const sql = new SqlDataSource({
      type: "sqlite",
      // The parent directory does not exist, so the open fails.
      database: path.resolve(tmpdir(), "hysteria-missing-dir", "nope.db"),
      logs: false,
    });

    await expect(sql.connect()).rejects.toBeInstanceOf(HysteriaError);

    // F001 invariants: a failed connect must leave nothing behind, so a retry and a
    // later disconnect both behave.
    expect((sql as any).sqlPool).toBeNull();
    expect((sql as any).ownsPool).toBe(false);
    expect(sql.isConnected).toBe(false);
  });

  test("a good path still connects", async () => {
    const dbPath = path.resolve(
      tmpdir(),
      `hysteria-connect-ok-${Date.now()}.db`,
    );
    const sql = new SqlDataSource({
      type: "sqlite",
      database: dbPath,
      logs: false,
    });

    try {
      await sql.connect();
      expect(sql.isConnected).toBe(true);
      await expect(sql.rawQuery("SELECT 1")).resolves.toBeDefined();
    } finally {
      await sql.disconnect();
      rmSync(dbPath, { force: true });
    }
  });
});
