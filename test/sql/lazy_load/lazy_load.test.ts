import { SqlDataSource } from "../../../src/sql/sql_data_source";

describe("SqlDataSource lazyLoad", () => {
  test("lazyLoad false (default) throws on from().many() when not connected", async () => {
    const sql = new SqlDataSource({
      type: "sqlite",
      database: "./sqlite.db",
    });

    await expect(sql.from("users").many()).rejects.toThrow();
  });

  test("lazyLoad false (default) throws on rawQuery when not connected", async () => {
    const sql = new SqlDataSource({
      type: "sqlite",
      database: "./sqlite.db",
    });

    await expect(sql.rawQuery("SELECT 1")).rejects.toThrow();
  });

  test("lazyLoad false (default) throws on schema() when not connected", () => {
    const sql = new SqlDataSource({
      type: "sqlite",
      database: "./sqlite.db",
    });

    expect(() => sql.schema()).toThrow();
  });

  test("lazyLoad true auto-connects on from().many()", async () => {
    const sql = new SqlDataSource({
      type: "sqlite",
      database: "./sqlite.db",
      lazyLoad: true,
    });

    expect(sql.isConnected).toBe(false);

    // Should auto-connect and execute
    const result = await sql.from("users_with_uuid").many();
    expect(sql.isConnected).toBe(true);
    expect(Array.isArray(result)).toBe(true);

    await sql.disconnect();
  });

  test("lazyLoad true auto-connects on rawQuery", async () => {
    const sql = new SqlDataSource({
      type: "sqlite",
      database: "./sqlite.db",
      lazyLoad: true,
    });

    expect(sql.isConnected).toBe(false);

    const result = await sql.rawQuery("SELECT 1 as val");
    expect(sql.isConnected).toBe(true);
    expect(result).toBeDefined();

    await sql.disconnect();
  });

  test("lazyLoad true allows schema() without connect", async () => {
    const sql = new SqlDataSource({
      type: "sqlite",
      database: "./sqlite.db",
      lazyLoad: true,
    });

    // schema() is sync and should not throw with lazyLoad
    const builder = sql.schema();
    expect(builder).toBeDefined();

    await sql.disconnect();
  });

  test("lazyLoad true concurrent queries share same connect call", async () => {
    const sql = new SqlDataSource({
      type: "sqlite",
      database: "./sqlite.db",
      lazyLoad: true,
    });

    // Fire multiple queries concurrently — should all succeed with one connect
    const [r1, r2, r3] = await Promise.all([
      sql.from("users_with_uuid").many(),
      sql.rawQuery("SELECT 1 as val"),
      sql.from("users_with_uuid").many(),
    ]);

    expect(sql.isConnected).toBe(true);
    expect(Array.isArray(r1)).toBe(true);
    expect(r2).toBeDefined();
    expect(Array.isArray(r3)).toBe(true);

    await sql.disconnect();
  });

  test("explicit connect() still works with lazyLoad true", async () => {
    const sql = new SqlDataSource({
      type: "sqlite",
      database: "./sqlite.db",
      lazyLoad: true,
    });

    await sql.connect();
    expect(sql.isConnected).toBe(true);

    const result = await sql.from("users_with_uuid").many();
    expect(Array.isArray(result)).toBe(true);

    await sql.disconnect();
  });
});
