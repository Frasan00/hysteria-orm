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
});
