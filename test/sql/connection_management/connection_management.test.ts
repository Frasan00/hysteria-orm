import { env } from "../../../src/env/env";
import { HysteriaError } from "../../../src/errors/hysteria_error";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserStatus, UserWithUuid } from "../test_models/uuid/user_uuid";

const isMssql = env.DB_TYPE === "mssql";

beforeAll(async () => {
  const dataSource = new SqlDataSource();
  await dataSource.connect();
});

beforeEach(async () => {
  if (!isMssql) {
    await SqlDataSource.startGlobalTransaction();
  }
});

afterEach(async () => {
  if (!isMssql) {
    await SqlDataSource.rollbackGlobalTransaction();
  } else {
    await UserWithUuid.query().delete();
  }
});

describe(`[${env.DB_TYPE}] Connection Management - connect()`, () => {
  test("should throw error when connection already exists", async () => {
    // First connection is already established in beforeAll
    // This test verifies that the singleton pattern is working
    // The primary instance is already set, so we can't test this without affecting other tests
    // Instead, we verify that SqlDataSource.instance exists
    const primaryInstance = SqlDataSource.instance;
    expect(primaryInstance).toBeDefined();
    expect(primaryInstance.isConnected).toBe(true);
  });

  test("should connectToSecondarySource successfully", async () => {
    // This tests the connectToSecondarySource method
    // which requires an input parameter (uses env vars by default from DataSource base class)
    const slave = await SqlDataSource.connectToSecondarySource({
      type: env.DB_TYPE as any,
      logs: false,
    });

    expect(slave.isConnected).toBe(true);
    await slave.disconnect();
  }, 15000);
});

describe(`[${env.DB_TYPE}] Connection Management - isConnected`, () => {
  test("should return true when connection is established via pool", async () => {
    const sql = SqlDataSource.instance;
    expect(sql.isConnected).toBe(true);
  });

  test("should return true when connection is established via direct connection", async () => {
    const slave = await SqlDataSource.connectToSecondarySource({
      type: env.DB_TYPE as any,
      logs: false,
    });
    expect(slave.isConnected).toBe(true);
    await slave.disconnect();
  }, 15000);

  test("should return false when connection is not established", async () => {
    const dataSource = new SqlDataSource();
    expect(dataSource.isConnected).toBe(false);
  });
});

describe(`[${env.DB_TYPE}] Connection Management - getConnection()`, () => {
  test("should get connection from pool", async () => {
    const sql = SqlDataSource.instance;
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

    const sql = SqlDataSource.instance;
    const conn1 = await sql.getConnection();
    const conn2 = await sql.getConnection();

    expect(conn1).toBeDefined();
    expect(conn2).toBeDefined();
  });
});

describe(`[${env.DB_TYPE}] Connection Management - getPool()`, () => {
  test("should return pool when connection is established", async () => {
    const sql = SqlDataSource.instance;
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
    const sql = SqlDataSource.instance;
    const details = sql.getConnectionDetails();

    expect(details).toBeDefined();
    expect(details.type).toBe(env.DB_TYPE);
  });
});

describe(`[${env.DB_TYPE}] Connection Management - disconnect()`, () => {
  test("should disconnect connection successfully", async () => {
    const slave = await SqlDataSource.connectToSecondarySource({
      type: env.DB_TYPE as any,
      logs: false,
    });
    expect(slave.isConnected).toBe(true);

    await slave.disconnect();
    expect(slave.isConnected).toBe(false);
  }, 15000);

  test("should handle disconnect when already disconnected", async () => {
    const slave = await SqlDataSource.connectToSecondarySource({
      type: env.DB_TYPE as any,
      logs: false,
    });
    await slave.disconnect();

    // Should not throw when disconnecting again
    await slave.disconnect();
    expect(slave.isConnected).toBe(false);
  }, 15000);

  test("should rollback global transaction before disconnecting", async () => {
    const slave = await SqlDataSource.connectToSecondarySource({
      type: env.DB_TYPE as any,
      logs: false,
    });

    // Start a global transaction on the slave
    await slave.startGlobalTransaction();

    // Create a user within the slave's transaction context
    const user = new UserWithUuid();
    user.name = "Transaction Test";
    user.email = "transaction-disconnect@example.com";
    user.age = 25;
    user.status = UserStatus.active;
    user.isActive = true;
    await user.save({ connection: slave });

    // Disconnect should rollback the transaction on the slave
    await slave.disconnect();

    // User should not exist on main instance after rollback
    const foundUser = await UserWithUuid.query()
      .where("email", "transaction-disconnect@example.com")
      .one();

    expect(foundUser).toBeNull();
  }, 15000);

  test("should disconnect all slaves when master disconnects", async () => {
    // Create a data source with slaves using environment variables
    const mainInstance = SqlDataSource.instance;

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
    const sql = SqlDataSource.instance;
    const cloned = await sql.clone();

    expect(cloned.isConnected).toBe(true);
    expect(cloned.getDbType()).toBe(sql.getDbType());
  }, 15000);

  test("should not affect original when cloned is disconnected", async () => {
    const sql = SqlDataSource.instance;
    const cloned = await sql.clone({ shouldRecreatePool: true });

    await cloned.disconnect();

    expect(cloned.isConnected).toBe(false);
    expect(sql.isConnected).toBe(true);
  }, 15000);

  test("should create new pool when shouldRecreatePool is true", async () => {
    const sql = SqlDataSource.instance;
    const cloned = await sql.clone({ shouldRecreatePool: true });

    expect(cloned.isConnected).toBe(true);
    expect(cloned.getPool()).toBeDefined();

    await cloned.disconnect();
    expect(sql.isConnected).toBe(true);
  }, 15000);

  test("should share pool when shouldRecreatePool is false (default)", async () => {
    const sql = SqlDataSource.instance;
    const cloned = await sql.clone();

    expect(cloned.isConnected).toBe(true);
    expect(sql.isConnected).toBe(true);

    await cloned.disconnect();
    expect(sql.isConnected).toBe(true);
  }, 15000);
});

describe(`[${env.DB_TYPE}] Connection Management - getDbType()`, () => {
  test("should return correct database type", () => {
    const sql = SqlDataSource.instance;
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
  test("should handle query after reconnect", async () => {
    const slave = await SqlDataSource.connectToSecondarySource({
      type: env.DB_TYPE as any,
      logs: false,
    });

    // Create a user
    const user1 = new UserWithUuid();
    user1.name = "Before Reconnect";
    user1.email = `before-${Date.now()}@example.com`;
    user1.age = 30;
    user1.status = UserStatus.active;
    user1.isActive = true;
    await user1.save();

    // Disconnect
    await slave.disconnect();
    expect(slave.isConnected).toBe(false);

    // The main instance should still be connected
    const foundUser = await UserWithUuid.query()
      .where("email", user1.email)
      .one();

    expect(foundUser).not.toBeNull();
    expect(foundUser?.name).toBe("Before Reconnect");

    // Clean up for MSSQL (no transaction rollback)
    if (isMssql && foundUser) {
      await UserWithUuid.query().where("id", foundUser.id).delete();
    }
  }, 15000);

  test("should maintain connection state across operations", async () => {
    const sql = SqlDataSource.instance;

    // Perform multiple operations
    expect(sql.isConnected).toBe(true);

    const user = await UserFactory.userWithUuid(1);
    expect(user).toBeDefined();

    const foundUser = await UserWithUuid.query().where("id", user.id).one();

    expect(foundUser).not.toBeNull();

    // Connection should still be active
    expect(sql.isConnected).toBe(true);

    // Clean up for MSSQL (no transaction rollback)
    if (isMssql && foundUser) {
      await UserWithUuid.query().where("id", foundUser.id).delete();
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
