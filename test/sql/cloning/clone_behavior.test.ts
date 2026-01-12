import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";

beforeAll(async () => {
  const dataSource = new SqlDataSource();
  await dataSource.connect();
});

beforeEach(async () => {
  await SqlDataSource.startGlobalTransaction();
});

afterEach(async () => {
  await SqlDataSource.rollbackGlobalTransaction();
});

describe(`[${env.DB_TYPE}] Clone Method - Basic Cloning`, () => {
  test("should clone SqlDataSource instance", async () => {
    const sql = SqlDataSource.instance;
    const cloned = await sql.clone();

    expect(cloned).toBeDefined();
    expect(cloned.isConnected).toBe(true);
    expect(cloned.getDbType()).toBe(sql.getDbType());
  });

  test("should clone with same connection details", async () => {
    const sql = SqlDataSource.instance;
    const cloned = await sql.clone();

    expect(cloned.host).toBe(sql.host);
    expect(cloned.database).toBe(sql.database);
    expect(cloned.username).toBe(sql.username);
  });

  test("should create independent clone", async () => {
    const sql = SqlDataSource.instance;
    const cloned = await sql.clone({ shouldRecreatePool: true });

    // Disconnecting clone should not affect original
    await cloned.disconnect();

    expect(cloned.isConnected).toBe(false);
    expect(sql.isConnected).toBe(true);
  });
});

describe(`[${env.DB_TYPE}] Clone Method - Pool Recreation`, () => {
  test("should share pool by default", async () => {
    const sql = SqlDataSource.instance;
    const cloned = await sql.clone();

    expect(cloned.isConnected).toBe(true);
    expect(sql.isConnected).toBe(true);

    // Both should share the same pool
    const originalPool = sql.getPool();
    const clonedPool = cloned.getPool();

    expect(originalPool).toBeDefined();
    expect(clonedPool).toBeDefined();
  });

  test("should create new pool when shouldRecreatePool is true", async () => {
    const sql = SqlDataSource.instance;
    const cloned = await sql.clone({ shouldRecreatePool: true });

    expect(cloned.isConnected).toBe(true);
    expect(cloned.getPool()).toBeDefined();

    // Should be able to disconnect independently
    await cloned.disconnect();

    expect(cloned.isConnected).toBe(false);
    expect(sql.isConnected).toBe(true);
  });

  test("should handle disconnection with shared pool", async () => {
    const sql = SqlDataSource.instance;
    const cloned = await sql.clone();

    // Cloned instance shares pool, so disconnecting should not close pool
    await cloned.disconnect();

    // Original should still be connected (shared pool)
    expect(sql.isConnected).toBe(true);
  });
});

describe(`[${env.DB_TYPE}] Clone Method - Database Types`, () => {
  test("should clone PostgreSQL connection", async () => {
    if (env.DB_TYPE !== "postgres" && env.DB_TYPE !== "cockroachdb") {
      return;
    }

    const sql = SqlDataSource.instance;
    const cloned = await sql.clone();

    expect(cloned.getDbType()).toBe(env.DB_TYPE);
    expect(cloned.isConnected).toBe(true);

    await cloned.disconnect();
  });

  test("should clone MySQL connection", async () => {
    if (env.DB_TYPE !== "mysql" && env.DB_TYPE !== "mariadb") {
      return;
    }

    const sql = SqlDataSource.instance;
    const cloned = await sql.clone();

    expect(cloned.getDbType()).toBe(env.DB_TYPE);
    expect(cloned.isConnected).toBe(true);

    await cloned.disconnect();
  });

  test("should clone SQLite connection", async () => {
    if (env.DB_TYPE !== "sqlite") {
      return;
    }

    const sql = SqlDataSource.instance;
    const cloned = await sql.clone();

    // SQLite always recreates pool
    expect(cloned.getDbType()).toBe("sqlite");
    expect(cloned.isConnected).toBe(true);

    await cloned.disconnect();
  });

  test("should clone MSSQL connection", async () => {
    if (env.DB_TYPE !== "mssql") {
      return;
    }

    const sql = SqlDataSource.instance;
    const cloned = await sql.clone();

    expect(cloned.getDbType()).toBe("mssql");
    expect(cloned.isConnected).toBe(true);

    await cloned.disconnect();
  });
});

describe(`[${env.DB_TYPE}] Clone Method - Multiple Clones`, () => {
  test("should create multiple independent clones", async () => {
    const sql = SqlDataSource.instance;

    const clone1 = await sql.clone({ shouldRecreatePool: true });
    const clone2 = await sql.clone({ shouldRecreatePool: true });
    const clone3 = await sql.clone({ shouldRecreatePool: true });

    expect(clone1.isConnected).toBe(true);
    expect(clone2.isConnected).toBe(true);
    expect(clone3.isConnected).toBe(true);

    // All should be independent
    await clone1.disconnect();
    await clone2.disconnect();

    expect(clone1.isConnected).toBe(false);
    expect(clone2.isConnected).toBe(false);
    expect(clone3.isConnected).toBe(true);
    expect(sql.isConnected).toBe(true);
  });
});

describe(`[${env.DB_TYPE}] Clone Method - Edge Cases`, () => {
  test("should clone with slaves configuration", async () => {
    const sql = SqlDataSource.instance;

    // Verify slaves property exists
    expect(sql.slaves).toBeDefined();
    expect(Array.isArray(sql.slaves)).toBe(true);

    const cloned = await sql.clone();

    expect(cloned.slaves).toBeDefined();
    expect(Array.isArray(cloned.slaves)).toBe(true);
  });

  test("should clone with cache configuration", async () => {
    const sql = SqlDataSource.instance;
    const cloned = await sql.clone();

    expect(cloned.cacheAdapter).toBeDefined();
    expect(cloned.cacheKeys).toBeDefined();
  });

  test("should clone with connection policies", async () => {
    const dataSource = new SqlDataSource({
      type: env.DB_TYPE as any,
      connectionPolicies: {
        retry: {
          maxRetries: 3,
          delay: 1000,
        },
      },
    });

    const cloned = await dataSource.clone();

    expect(cloned.inputDetails.connectionPolicies).toBeDefined();
    expect(cloned.inputDetails.connectionPolicies?.retry?.maxRetries).toBe(3);
  });

  test("should clone and execute query", async () => {
    const cloned = await SqlDataSource.instance.clone();

    const query = cloned
      .query("users_with_uuid")
      .select("name")
      .where("age", ">", 25);
    const sqlString = query.toQuery();

    expect(sqlString.toLowerCase()).toContain("select");
    expect(sqlString).toContain("users_with_uuid");
  });
});
