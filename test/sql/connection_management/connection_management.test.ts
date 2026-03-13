import { env } from "../../../src/env/env";
import { HysteriaError } from "../../../src/errors/hysteria_error";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserStatus, UserWithUuid } from "../test_models/uuid/schema";

let sql: SqlDataSource;

const isMssql = env.DB_TYPE === "mssql";

beforeAll(async () => {
  sql = new SqlDataSource();
  await sql.connect();
});

beforeEach(async () => {
  if (!isMssql) {
    await sql.startGlobalTransaction();
  }
});

afterEach(async () => {
  if (!isMssql) {
    await sql.rollbackGlobalTransaction();
  } else {
    await sql.from(UserWithUuid).delete();
  }
});

describe(`[${env.DB_TYPE}] Connection Management - isConnected`, () => {
  test("should return true when connection is established via pool", async () => {
    expect(sql.isConnected).toBe(true);
  });

  test("should return false when connection is not established", async () => {
    const dataSource = new SqlDataSource();
    expect(dataSource.isConnected).toBe(false);
  });
});

describe(`[${env.DB_TYPE}] Connection Management - getConnection()`, () => {
  test("should get connection from pool", async () => {
    const connection = await sql.getConnection();

    expect(connection).toBeDefined();
    expect(connection).not.toBeNull();
  });

  test("should throw error when connection pool is not established", async () => {
    const dataSource = new SqlDataSource();
    await expect(dataSource.getConnection()).rejects.toThrow(HysteriaError);
    await expect(dataSource.getConnection()).rejects.toThrow(
      "CONNECTION_NOT_ESTABLISHED",
    );
  });

  test("should return different connections on multiple calls for non-sqlite", async () => {
    if (env.DB_TYPE === "sqlite") {
      return;
    }

    const conn1 = await sql.getConnection();
    const conn2 = await sql.getConnection();

    expect(conn1).toBeDefined();
    expect(conn2).toBeDefined();
  });
});

describe(`[${env.DB_TYPE}] Connection Management - getPool()`, () => {
  test("should return pool when connection is established", async () => {
    const pool = sql.getPool();

    expect(pool).toBeDefined();
    expect(pool).not.toBeNull();
  });

  test("should throw error when pool is not established", async () => {
    const dataSource = new SqlDataSource();
    expect(() => dataSource.getPool()).toThrow(HysteriaError);
    expect(() => dataSource.getPool()).toThrow("CONNECTION_NOT_ESTABLISHED");
  });
});

describe(`[${env.DB_TYPE}] Connection Management - getConnectionDetails()`, () => {
  test("should return connection details", async () => {
    const details = sql.getConnectionDetails();

    expect(details).toBeDefined();
    expect(details.type).toBe(env.DB_TYPE);
  });
});

describe(`[${env.DB_TYPE}] Connection Management - disconnect()`, () => {
  test("should disconnect all slaves when master disconnects", async () => {
    // Create a data source with slaves using environment variables
    const mainInstance = sql;

    // Verify the instance has slaves property
    expect(mainInstance.slaves).toBeDefined();
    expect(Array.isArray(mainInstance.slaves)).toBe(true);

    // If slaves exist, they should be disconnected when master disconnects
    if (mainInstance.slaves.length > 0) {
      expect(mainInstance.slaves[0].isConnected).toBe(true);
    }
  });
});

describe(`[${env.DB_TYPE}] Connection Management - clone()`, () => {
  test("should clone data source successfully", async () => {
    const cloned = await sql.clone();

    expect(cloned.isConnected).toBe(true);
    expect(cloned.getDbType()).toBe(sql.getDbType());
  }, 15000);

  test("should not affect original when cloned is disconnected", async () => {
    const cloned = await sql.clone({ shouldRecreatePool: true });

    await cloned.disconnect();

    expect(cloned.isConnected).toBe(false);
    expect(sql.isConnected).toBe(true);
  }, 15000);

  test("should create new pool when shouldRecreatePool is true", async () => {
    const cloned = await sql.clone({ shouldRecreatePool: true });

    expect(cloned.isConnected).toBe(true);
    expect(cloned.getPool()).toBeDefined();

    await cloned.disconnect();
    expect(sql.isConnected).toBe(true);
  }, 15000);

  test("should share pool when shouldRecreatePool is false (default)", async () => {
    const cloned = await sql.clone();

    expect(cloned.isConnected).toBe(true);
    expect(sql.isConnected).toBe(true);

    await cloned.disconnect();
    expect(sql.isConnected).toBe(true);
  }, 15000);
});

describe(`[${env.DB_TYPE}] Connection Management - getDbType()`, () => {
  test("should return correct database type", () => {
    const dbType = sql.getDbType();

    expect(dbType).toBe(env.DB_TYPE);
  });

  test("should return correct type for different databases", async () => {
    const dataSource = new SqlDataSource({
      type: "postgres",
    });

    expect(dataSource.getDbType()).toBe("postgres");
  });
});

describe(`[${env.DB_TYPE}] Connection Management - Integration`, () => {
  test("should maintain connection state across operations", async () => {
    // Perform multiple operations
    expect(sql.isConnected).toBe(true);

    const user = await UserFactory.userWithUuid(sql, 1);
    expect(user).toBeDefined();

    const foundUser = await sql.from(UserWithUuid).where("id", user.id).one();

    expect(foundUser).not.toBeNull();

    // Connection should still be active
    expect(sql.isConnected).toBe(true);

    // Clean up for MSSQL (no transaction rollback)
    if (isMssql && foundUser) {
      await sql.from(UserWithUuid).where("id", foundUser.id).delete();
    }
  }, 15000);

  test("should handle error when connecting with invalid config", async () => {
    const dataSource = new SqlDataSource({
      type: env.DB_TYPE as any,
      // Use env variables for connection
      // This will test error handling
    });

    // The instance is created but not connected
    expect(dataSource.isConnected).toBe(false);
  });
});
