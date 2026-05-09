import { SqlDataSource } from "../../../src/sql/sql_data_source";

describe("Observer Query ID", () => {
  let sql: SqlDataSource;

  beforeEach(() => {
    sql = new SqlDataSource({
      type: "sqlite",
      database: ":memory:",
    });
  });

  it("should have the same ID across onBeforeQuery and onAfterQuery hooks", async () => {
    const beforeIds: string[] = [];
    const afterIds: string[] = [];

    sql.addObserver({
      onBeforeQuery: (ctx) => {
        beforeIds.push(ctx.id);
      },
      onAfterQuery: (ctx) => {
        afterIds.push(ctx.id);
      },
    });

    await sql.connect();
    await sql.rawQuery("SELECT 1");

    expect(beforeIds.length).toBe(1);
    expect(afterIds.length).toBe(1);
    expect(beforeIds[0]).toBe(afterIds[0]);
    expect(beforeIds[0]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("should generate different IDs for different queries", async () => {
    const ids: string[] = [];

    sql.addObserver({
      onBeforeQuery: (ctx) => {
        ids.push(ctx.id);
      },
    });

    await sql.connect();
    await sql.rawQuery("SELECT 1");
    await sql.rawQuery("SELECT 2");
    await sql.rawQuery("SELECT 3");

    expect(ids.length).toBe(3);
    expect(new Set(ids).size).toBe(3);
  });

  it("should have ID present in all lifecycle hooks with correct format", async () => {
    const contexts: { before?: string; after?: string; error?: string } = {};

    sql.addObserver({
      onBeforeQuery: (ctx) => {
        contexts.before = ctx.id;
      },
      onAfterQuery: (ctx) => {
        contexts.after = ctx.id;
      },
    });

    await sql.connect();
    await sql.rawQuery("SELECT 1 as value");

    expect(contexts.before).toBeDefined();
    expect(contexts.after).toBeDefined();
    expect(contexts.before).toBe(contexts.after);
    expect(contexts.before).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("should maintain ID consistency with multiple observers", async () => {
    const observer1Ids: string[] = [];
    const observer2Ids: string[] = [];

    sql.addObserver({
      onBeforeQuery: (ctx) => {
        observer1Ids.push(ctx.id);
      },
      onAfterQuery: (ctx) => {
        observer1Ids.push(ctx.id);
      },
    });

    sql.addObserver({
      onBeforeQuery: (ctx) => {
        observer2Ids.push(ctx.id);
      },
      onAfterQuery: (ctx) => {
        observer2Ids.push(ctx.id);
      },
    });

    await sql.connect();
    await sql.rawQuery("SELECT 1");

    expect(observer1Ids.length).toBe(2);
    expect(observer2Ids.length).toBe(2);
    expect(observer1Ids[0]).toBe(observer1Ids[1]);
    expect(observer2Ids[0]).toBe(observer2Ids[1]);
    expect(observer1Ids[0]).toBe(observer2Ids[0]);
  });
});
