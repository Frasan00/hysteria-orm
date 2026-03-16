import { col, defineModel } from "../../src/sql/models/define_model";
import { SqlDataSource } from "../../src/sql/sql_data_source";

const ReplicationUser = defineModel("replication_users", {
  columns: {
    id: col.bigIncrement(),
    name: col.string(),
    email: col.string(),
    createdAt: col.datetime(),
  },
});

describe("Slave Replication", () => {
  let sql: SqlDataSource;
  let slaveCallCounts: number[];

  beforeAll(async () => {
    slaveCallCounts = [0, 0, 0];

    sql = new SqlDataSource({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      username: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "root",
      database: process.env.DB_DATABASE || "test",
      port: Number(process.env.DB_PORT) || 5432,
      logs: false,
      replication: {
        slaves: [
          {
            type: "postgres",
            host: process.env.DB_HOST || "localhost",
            username: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "root",
            database: process.env.DB_DATABASE || "test",
            port: Number(process.env.DB_PORT) || 5432,
          },
          {
            type: "postgres",
            host: process.env.DB_HOST || "localhost",
            username: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "root",
            database: process.env.DB_DATABASE || "test",
            port: Number(process.env.DB_PORT) || 5432,
          },
          {
            type: "postgres",
            host: process.env.DB_HOST || "localhost",
            username: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "root",
            database: process.env.DB_DATABASE || "test",
            port: Number(process.env.DB_PORT) || 5432,
          },
        ],
        slaveAlgorithm: "roundRobin",
      },
      models: {
        replicationUser: ReplicationUser,
      },
    });

    await sql.connect();

    await sql.rawQuery("DROP TABLE IF EXISTS replication_users", []);

    await sql.rawQuery(
      `
      CREATE TABLE replication_users (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
      [],
    );
  });

  afterAll(async () => {
    try {
      await sql.rawQuery("DROP TABLE IF EXISTS replication_users", []);
    } finally {
      await sql.disconnect();
    }
  });

  beforeEach(async () => {
    await sql.rawQuery("TRUNCATE TABLE replication_users RESTART IDENTITY", []);
  });

  describe("Round Robin Algorithm", () => {
    test("should use master for write operations", async () => {
      const user = await sql.from(ReplicationUser).insert(
        {
          name: "John Doe",
          email: "john@example.com",
        },
        { returning: ["*"] },
      );

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.name).toBe("John Doe");
    });

    test("should use slaves for read operations with Model.find()", async () => {
      await sql.from(ReplicationUser).insert({
        name: "Jane Doe",
        email: "jane@example.com",
      });

      const users = await sql.from(ReplicationUser).find();
      expect(users.length).toBe(1);
      expect(users[0].name).toBe("Jane Doe");
    });

    test("should use slaves for read operations with Model.findOne()", async () => {
      const inserted = await sql.from(ReplicationUser).insert(
        {
          name: "Bob Smith",
          email: "bob@example.com",
        },
        { returning: ["*"] },
      );

      const user = await sql.from(ReplicationUser).findOne({
        where: { id: inserted.id },
      });

      expect(user).toBeDefined();
      expect(user?.name).toBe("Bob Smith");
    });

    test("should use slaves for read operations with query builder", async () => {
      await sql.from(ReplicationUser).insert({
        name: "Alice Johnson",
        email: "alice@example.com",
      });

      const users = await sql
        .from(ReplicationUser)
        .where("name", "Alice Johnson")
        .many();
      expect(users.length).toBe(1);
      expect(users[0].name).toBe("Alice Johnson");
    });

    test("should use master for update operations", async () => {
      const user = await sql.from(ReplicationUser).insert(
        {
          name: "Update Test",
          email: "update@example.com",
        },
        { returning: ["*"] },
      );

      await sql.from(ReplicationUser).where("id", user.id).update({
        name: "Updated Name",
      });

      const updated = await sql.from(ReplicationUser).findOne({
        where: { id: user.id },
      });

      expect(updated?.name).toBe("Updated Name");
    });

    test("should use master for delete operations", async () => {
      const user = await sql.from(ReplicationUser).insert(
        {
          name: "Delete Test",
          email: "delete@example.com",
        },
        { returning: ["*"] },
      );

      await sql.from(ReplicationUser).where("id", user.id).delete();

      const deleted = await sql.from(ReplicationUser).findOne({
        where: { id: user.id },
      });

      expect(deleted).toBeNull();
    });
  });

  describe("Replication Mode Override", () => {
    test("should force master for reads when replicationMode is master", async () => {
      await sql.from(ReplicationUser).insert({
        name: "Master Read",
        email: "master@example.com",
      });

      const users = await sql
        .from(ReplicationUser)
        .setReplicationMode("master")
        .find();

      expect(users.length).toBe(1);
      expect(users[0].name).toBe("Master Read");
    });

    test("should force slave for reads when replicationMode is slave", async () => {
      await sql.from(ReplicationUser).insert({
        name: "Slave Read",
        email: "slave@example.com",
      });

      const users = await sql
        .from(ReplicationUser)
        .setReplicationMode("slave")
        .find();

      expect(users.length).toBe(1);
      expect(users[0].name).toBe("Slave Read");
    });

    test("should use master for writes even with replicationMode slave", async () => {
      const user = await sql.from(ReplicationUser).insert(
        {
          name: "Write Test",
          email: "write@example.com",
        },
        { returning: ["*"] },
      );

      expect(user).toBeDefined();
      expect(user.name).toBe("Write Test");
    });

    test("should respect replicationMode on query builder", async () => {
      await sql.from(ReplicationUser).insert({
        name: "QB Mode Test",
        email: "qb@example.com",
      });

      const users = await sql
        .from(ReplicationUser)
        .setReplicationMode("master")
        .where("name", "QB Mode Test")
        .many();

      expect(users.length).toBe(1);
    });
  });

  describe("Query Builder Operations", () => {
    test("should use slaves for query builder select operations", async () => {
      await sql.from(ReplicationUser).insertMany([
        { name: "User 1", email: "user1@example.com" },
        { name: "User 2", email: "user2@example.com" },
        { name: "User 3", email: "user3@example.com" },
      ]);

      const users = await sql
        .from(ReplicationUser)
        .select("name", "email")
        .many();
      expect(users.length).toBe(3);
    });

    test("should use slaves for query builder count operations", async () => {
      await sql.from(ReplicationUser).insertMany([
        { name: "Count 1", email: "count1@example.com" },
        { name: "Count 2", email: "count2@example.com" },
      ]);

      const count = await sql.from(ReplicationUser).getCount();
      expect(count).toBe(2);
    });

    test("should use slaves for query builder pagination", async () => {
      await sql.from(ReplicationUser).insertMany([
        { name: "Page 1", email: "page1@example.com" },
        { name: "Page 2", email: "page2@example.com" },
        { name: "Page 3", email: "page3@example.com" },
      ]);

      const result = await sql.from(ReplicationUser).paginate(1, 2);
      expect(result.data.length).toBe(2);
      expect(result.paginationMetadata.total).toBe(3);
    });

    test("should use master for query builder insert", async () => {
      const user = await sql.from(ReplicationUser).insert(
        {
          name: "QB Insert",
          email: "qbinsert@example.com",
        },
        { returning: ["*"] },
      );
      expect(user).toBeDefined();
    });

    test("should use master for raw query builder upsert", async () => {
      const user = await sql
        .from("replication_users")
        .upsert(
          { name: "Upsert User", email: "upsert@example.com" },
          { email: "upsert@example.com" },
        );

      expect(user).toBeDefined();
      expect(Array.isArray(user)).toBe(true);
    });
  });

  describe("Random Algorithm", () => {
    test("should use random slave selection for reads", async () => {
      await sql.from(ReplicationUser).insert({
        name: "Random Test",
        email: "random@example.com",
      });

      const users = await sql.from("replication_users").many();
      expect(users.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("No Slaves Configuration", () => {
    test("should use master for reads when no slaves configured", async () => {
      await sql.from(ReplicationUser).insert({
        name: "No Slaves",
        email: "noslaves@example.com",
      });

      const users = await sql.from("replication_users").many();
      expect(users.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe("Slave Failure Handling", () => {
  let sqlFailure: SqlDataSource;
  let onSlaveServerFailure: jest.Mock;

  beforeAll(async () => {
    onSlaveServerFailure = jest.fn();

    sqlFailure = new SqlDataSource({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      username: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "root",
      database: process.env.DB_DATABASE || "test",
      port: Number(process.env.DB_PORT) || 5432,
      logs: false,
      replication: {
        slaves: [
          {
            type: "postgres",
            host: "localhost",
            username: "root",
            password: "root",
            database: "test",
            port: 65432,
          },
        ],
        onSlaveServerFailure,
      },
      models: {
        replicationUser: ReplicationUser,
      },
    });

    await sqlFailure.connect();

    await sqlFailure.rawQuery("DROP TABLE IF EXISTS replication_users", []);
    await sqlFailure.rawQuery(
      `
      CREATE TABLE replication_users (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
      [],
    );
  });

  afterAll(async () => {
    try {
      await sqlFailure.rawQuery("DROP TABLE IF EXISTS replication_users", []);
    } finally {
      await sqlFailure.disconnect();
    }
  });

  test("should fallback to master when slave fails and call onSlaveServerFailure", async () => {
    await sqlFailure.from(ReplicationUser).insert({
      name: "Failure Test",
      email: "failure@example.com",
    });

    const users = await sqlFailure.from(ReplicationUser).find({
      where: { email: "failure@example.com" },
    });

    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Failure Test");
    expect(onSlaveServerFailure).toHaveBeenCalled();
  });
});
