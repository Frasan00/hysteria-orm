import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserWithUuid } from "../test_models/uuid/user_uuid";
import crypto from "node:crypto";

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

describe(`[${env.DB_TYPE}] WriteOperation - Lazy Execution`, () => {
  describe("QueryBuilder.insert", () => {
    test("should NOT execute when calling toQuery()", async () => {
      const sql = SqlDataSource.instance;
      const writeOp = sql.query("users_with_uuid").insert({
        id: crypto.randomUUID(),
        name: "Test User",
        email: "test@example.com",
      });

      const sqlString = writeOp.toQuery();

      expect(sqlString.toLowerCase()).toContain("insert");
      expect(sqlString).toContain("users_with_uuid");

      const count = await sql.query("users_with_uuid").getCount();
      expect(count).toBe(0);
    });

    test("should NOT execute when calling unWrap()", async () => {
      const sql = SqlDataSource.instance;
      const writeOp = sql.query("users_with_uuid").insert({
        id: crypto.randomUUID(),
        name: "Test User 2",
        email: "test2@example.com",
      });

      const { sql: sqlString, bindings } = writeOp.unWrap();

      expect(sqlString.toLowerCase()).toContain("insert");
      expect(bindings).toBeDefined();
      expect(Array.isArray(bindings)).toBe(true);

      const count = await sql.query("users_with_uuid").getCount();
      expect(count).toBe(0);
    });

    test("should execute when awaited", async () => {
      const sql = SqlDataSource.instance;
      const writeOp = sql.query("users_with_uuid").insert({
        id: crypto.randomUUID(),
        name: "Executed User",
        email: "executed@example.com",
      });

      await writeOp;

      const count = await sql.query("users_with_uuid").getCount();
      expect(count).toBe(1);
    });
  });

  describe("QueryBuilder.insertMany", () => {
    test("should NOT execute when calling toQuery()", async () => {
      const sql = SqlDataSource.instance;
      const writeOp = sql.query("users_with_uuid").insertMany([
        { id: crypto.randomUUID(), name: "User 1", email: "user1@example.com" },
        { id: crypto.randomUUID(), name: "User 2", email: "user2@example.com" },
      ]);

      const sqlString = writeOp.toQuery();

      expect(sqlString.toLowerCase()).toContain("insert");

      const count = await sql.query("users_with_uuid").getCount();
      expect(count).toBe(0);
    });

    test("should execute when awaited", async () => {
      const sql = SqlDataSource.instance;
      await sql.query("users_with_uuid").insertMany([
        { id: crypto.randomUUID(), name: "User 1", email: "user1@example.com" },
        { id: crypto.randomUUID(), name: "User 2", email: "user2@example.com" },
      ]);

      const count = await sql.query("users_with_uuid").getCount();
      expect(count).toBe(2);
    });
  });

  describe("QueryBuilder.update", () => {
    test("should NOT execute when calling toQuery()", async () => {
      const sql = SqlDataSource.instance;

      await sql.query("users_with_uuid").insert({
        id: crypto.randomUUID(),
        name: "Original Name",
        email: "original@example.com",
      });

      const writeOp = sql
        .query("users_with_uuid")
        .where("id", "uuid-update")
        .update({ name: "Updated Name" });

      const sqlString = writeOp.toQuery();

      expect(sqlString.toLowerCase()).toContain("update");

      const user = await sql.query("users_with_uuid").one();
      expect(user?.name).toBe("Original Name");
    });

    test("should execute when awaited", async () => {
      const sql = SqlDataSource.instance;

      await sql.query("users_with_uuid").insert({
        id: crypto.randomUUID(),
        name: "Original Name",
        email: "original2@example.com",
      });

      await sql.query("users_with_uuid").update({ name: "Updated Name" });

      const user = await sql.query("users_with_uuid").one();
      expect(user?.name).toBe("Updated Name");
    });
  });

  describe("QueryBuilder.delete", () => {
    test("should NOT execute when calling toQuery()", async () => {
      const sql = SqlDataSource.instance;

      await sql.query("users_with_uuid").insert({
        id: crypto.randomUUID(),
        name: "To Delete",
        email: "delete@example.com",
      });

      const writeOp = sql
        .query("users_with_uuid")
        .where("id", "uuid-delete")
        .delete();

      const sqlString = writeOp.toQuery();

      expect(sqlString.toLowerCase()).toContain("delete");

      const count = await sql.query("users_with_uuid").getCount();
      expect(count).toBe(1);
    });

    test("should execute when awaited", async () => {
      const sql = SqlDataSource.instance;

      await sql.query("users_with_uuid").insert({
        id: crypto.randomUUID(),
        name: "To Delete 2",
        email: "delete2@example.com",
      });

      await sql.query("users_with_uuid").delete();

      const count = await sql.query("users_with_uuid").getCount();
      expect(count).toBe(0);
    });
  });
});

describe(`[${env.DB_TYPE}] WriteOperation - Model.insert`, () => {
  describe("Model.insert", () => {
    test("should NOT execute when calling toQuery()", async () => {
      const writeOp = UserWithUuid.insert({
        id: crypto.randomUUID(),
        name: "Model User",
        email: "model@example.com",
      });

      const sqlString = writeOp.toQuery();

      expect(sqlString.toLowerCase()).toContain("insert");
      expect(sqlString).toContain("users_with_uuid");

      const count = await UserWithUuid.query().getCount();
      expect(count).toBe(0);
    });

    test("should execute when awaited", async () => {
      await UserWithUuid.insert({
        id: crypto.randomUUID(),
        name: "Model User 2",
        email: "model2@example.com",
      });

      const count = await UserWithUuid.query().getCount();
      expect(count).toBe(1);
    });
  });

  describe("Model.insertMany", () => {
    test("should NOT execute when calling toQuery()", async () => {
      const writeOp = UserWithUuid.insertMany([
        {
          id: crypto.randomUUID(),
          name: "Many User 1",
          email: "many1@example.com",
        },
        {
          id: crypto.randomUUID(),
          name: "Many User 2",
          email: "many2@example.com",
        },
      ]);

      const sqlString = writeOp.toQuery();

      expect(sqlString.toLowerCase()).toContain("insert");

      const count = await UserWithUuid.query().getCount();
      expect(count).toBe(0);
    });

    test("should execute when awaited", async () => {
      await UserWithUuid.insertMany([
        {
          id: crypto.randomUUID(),
          name: "Many User 3",
          email: "many3@example.com",
        },
        {
          id: crypto.randomUUID(),
          name: "Many User 4",
          email: "many4@example.com",
        },
      ]);

      const count = await UserWithUuid.query().getCount();
      expect(count).toBe(2);
    });
  });
});

describe(`[${env.DB_TYPE}] WriteOperation - Promise-like behavior`, () => {
  test("should work with .then()", async () => {
    const sql = SqlDataSource.instance;

    let resolved = false;
    await sql
      .query("users_with_uuid")
      .insert({
        id: crypto.randomUUID(),
        name: "Then User",
        email: "then@example.com",
      })
      .then(() => {
        resolved = true;
      });

    expect(resolved).toBe(true);
    const count = await sql.query("users_with_uuid").getCount();
    expect(count).toBe(1);
  });

  test("should work with .catch()", async () => {
    const sql = SqlDataSource.instance;

    let caught = false;
    await sql
      .query("nonexistent_table")
      .insert({ id: crypto.randomUUID() })
      .catch(() => {
        caught = true;
      });

    expect(caught).toBe(true);
  });

  test("should work with .finally()", async () => {
    const sql = SqlDataSource.instance;

    let finalized = false;
    await sql
      .query("users_with_uuid")
      .insert({
        id: crypto.randomUUID(),
        name: "Finally User",
        email: "finally@example.com",
      })
      .finally(() => {
        finalized = true;
      });

    expect(finalized).toBe(true);
  });
});
