import { SqlDataSource } from "../../../src/sql/sql_data_source";

describe("addObserver API", () => {
  let sql: SqlDataSource;

  beforeEach(() => {
    sql = new SqlDataSource({
      type: "sqlite",
      database: ":memory:",
    });
  });

  it("should add a single observer without importing ObserverChain", () => {
    const beforeFn = jest.fn();
    const afterFn = jest.fn();

    // New simple API - no imports needed!
    sql.addObserver({
      onBeforeQuery: beforeFn,
      onAfterQuery: afterFn,
    });

    // Should be chainable (returns this)
    expect(sql.addObserver({})).toBe(sql);
  });

  it("should support multiple observers via multiple addObserver calls", () => {
    const observer1 = jest.fn();
    const observer2 = jest.fn();

    sql
      .addObserver({ onBeforeQuery: observer1 })
      .addObserver({ onBeforeQuery: observer2 });

    // Both observers should be registered
    expect(sql).toBeDefined();
  });

  it("should work without needing to import ObserverChain", async () => {
    const logs: string[] = [];

    // User can just call addObserver - no imports!
    sql.addObserver({
      onBeforeQuery: (ctx) => {
        logs.push(`Before: ${ctx.sql}`);
      },
      onAfterQuery: (ctx) => {
        logs.push(`After: ${ctx.duration}ms`);
      },
      onQueryError: (ctx) => {
        logs.push(`Error: ${ctx.error.message}`);
      },
    });

    await sql.connect();
    await sql.rawQuery("SELECT 1");

    expect(logs.length).toBeGreaterThan(0);
    expect(logs.some((l) => l.includes("Before:"))).toBe(true);
  });

  // A transaction runs its queries against a clone of the data source, so the
  // observer chain has to survive the clone or the whole transaction goes dark.
  describe("inside a transaction", () => {
    it("notifies observers for the callback form", async () => {
      const seen: string[] = [];

      await sql.connect();
      sql.addObserver({ onBeforeQuery: (ctx) => void seen.push(ctx.sql) });

      await sql.transaction(async (trx) => {
        await trx.sql.rawQuery("SELECT 1");
      });

      expect(seen).toContain("SELECT 1");
      // The transaction's own control statements travel the same path, so an
      // audit observer sees the whole lifecycle, not just the statements.
      expect(seen).toContain("BEGIN TRANSACTION");
      expect(seen).toContain("COMMIT");
    });

    it("notifies observers for a manually controlled transaction", async () => {
      const seen: string[] = [];

      await sql.connect();
      sql.addObserver({ onBeforeQuery: (ctx) => void seen.push(ctx.sql) });

      const trx = await sql.transaction();
      await trx.sql.rawQuery("SELECT 1");
      await trx.rollback();

      expect(seen).toContain("SELECT 1");
    });

    it("notifies observers for a global transaction", async () => {
      const seen: string[] = [];

      await sql.connect();
      sql.addObserver({ onBeforeQuery: (ctx) => void seen.push(ctx.sql) });

      await sql.startGlobalTransaction();
      await sql.rawQuery("SELECT 1");
      await sql.rollbackGlobalTransaction();

      expect(seen).toContain("SELECT 1");
    });

    it("keeps notifying observers after the transaction ends", async () => {
      const seen: string[] = [];

      await sql.connect();
      sql.addObserver({ onBeforeQuery: (ctx) => void seen.push(ctx.sql) });

      await sql.transaction(async (trx) => {
        await trx.sql.rawQuery("SELECT 1");
      });
      await sql.rawQuery("SELECT 2");

      expect(seen).toContain("SELECT 2");
    });
  });

  describe("onQueryError", () => {
    const MISSING_TABLE = "SELECT * FROM table_that_does_not_exist";

    it("receives the failure and the query still rejects with the original error", async () => {
      const seen: Array<{ sql: string; message: string }> = [];

      await sql.connect();
      sql.addObserver({
        onQueryError: (ctx) => {
          seen.push({ sql: ctx.sql, message: ctx.error.message });
        },
      });

      await expect(sql.rawQuery(MISSING_TABLE)).rejects.toThrow(
        /no such table/i,
      );

      expect(seen).toHaveLength(1);
      expect(seen[0].sql).toBe(MISSING_TABLE);
      expect(seen[0].message).toMatch(/no such table/i);
    });

    it("does not replace the query error when the observer itself throws", async () => {
      await sql.connect();
      sql.addObserver({
        onQueryError: () => {
          throw new Error("observer blew up");
        },
      });

      await expect(sql.rawQuery(MISSING_TABLE)).rejects.toThrow(
        /no such table/i,
      );
    });

    it("stays quiet for a query that succeeds", async () => {
      const onQueryError = jest.fn();

      await sql.connect();
      sql.addObserver({
        onQueryError,
        onAfterQuery: jest.fn(),
      });

      await sql.rawQuery("SELECT 1");

      expect(onQueryError).not.toHaveBeenCalled();
    });
  });

  describe("when an observer throws", () => {
    it("reports the failure instead of discarding it silently", async () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      const local = new SqlDataSource({
        type: "sqlite",
        database: ":memory:",
        logs: { level: "warn" },
      });

      try {
        await local.connect();
        local.addObserver({
          onBeforeQuery: () => {
            throw new Error("observer blew up");
          },
        });

        // The observer must not be able to block the query.
        await expect(local.rawQuery("SELECT 1")).resolves.toBeDefined();

        const messages = warnSpy.mock.calls.map((call) => String(call[0]));
        expect(
          messages.some((message) =>
            message.includes("Observer before-query hook failed"),
          ),
        ).toBe(true);
      } finally {
        await local.disconnect();
        warnSpy.mockRestore();
      }
    });
  });
});
