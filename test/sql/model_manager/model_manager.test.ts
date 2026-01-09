import { env } from "../../../src/env/env";
import { HysteriaError } from "../../../src/errors/hysteria_error";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserWithUuid, UserStatus } from "../test_models/uuid/user_uuid";

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

describe(`[${env.DB_TYPE}] Model Manager - Basic Operations`, () => {
  test("should get model manager for UserWithUuid model", () => {
    const sql = SqlDataSource.instance;
    const manager = sql.getModelManager(UserWithUuid);

    expect(manager).toBeDefined();
  });

  test("should get model manager with different models", () => {
    const sql = SqlDataSource.instance;

    const userManager = sql.getModelManager(UserWithUuid);
    expect(userManager).toBeDefined();
  });

  test("should throw error when not connected", () => {
    const dataSource = new SqlDataSource({
      type: env.DB_TYPE as any,
    });

    expect(() => dataSource.getModelManager(UserWithUuid)).toThrow(
      HysteriaError,
    );
    expect(() => dataSource.getModelManager(UserWithUuid)).toThrow(
      "CONNECTION_NOT_ESTABLISHED",
    );
  });
});

describe(`[${env.DB_TYPE}] Model Manager - Query Operations`, () => {
  test("should perform query through model manager", async () => {
    const sql = SqlDataSource.instance;
    const manager = sql.getModelManager(UserWithUuid);

    await UserFactory.userWithUuid(1);

    const users = await manager.query().many();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
  });

  test("should perform one query through model manager", async () => {
    const sql = SqlDataSource.instance;
    const manager = sql.getModelManager(UserWithUuid);

    const user = await UserFactory.userWithUuid(1);

    const foundUser = await manager.query().where("id", user.id).one();

    expect(foundUser).not.toBeNull();
    expect(foundUser?.id).toBe(user.id);
  });

  test("should perform exists query through model manager", async () => {
    const sql = SqlDataSource.instance;
    const manager = sql.getModelManager(UserWithUuid);

    await UserFactory.userWithUuid(1);

    const exists = await manager.query().where("age", ">", 20).exists();

    expect(exists).toBe(true);
  });
});

describe(`[${env.DB_TYPE}] Model Manager - CRUD Operations`, () => {
  test("should insert record through model manager", async () => {
    const sql = SqlDataSource.instance;
    const manager = sql.getModelManager(UserWithUuid);

    const user = await manager.insert({
      name: "Manager Insert Test",
      email: `manager-insert-${Date.now()}@example.com`,
      age: 25,
      status: UserStatus.active,
      isActive: true,
    });

    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.name).toBe("Manager Insert Test");
  });

  test("should update record through model manager", async () => {
    const sql = SqlDataSource.instance;
    const manager = sql.getModelManager(UserWithUuid);

    const user = await UserFactory.userWithUuid(1);

    await manager
      .query()
      .where("id", user.id)
      .update({ name: "Manager Updated" });

    const foundUser = await manager.query().where("id", user.id).one();

    expect(foundUser?.name).toBe("Manager Updated");
  });

  test("should delete record through model manager", async () => {
    const sql = SqlDataSource.instance;
    const manager = sql.getModelManager(UserWithUuid);

    const user = await UserFactory.userWithUuid(1);

    await manager.query().where("id", user.id).delete();

    const foundUser = await manager.query().where("id", user.id).one();

    expect(foundUser).toBeNull();
  });

  test("should find by primary key through model manager", async () => {
    const sql = SqlDataSource.instance;
    const manager = sql.getModelManager(UserWithUuid);

    const user = await UserFactory.userWithUuid(1);

    const foundUser = await manager.findOneByPrimaryKey(user.id);
    expect(foundUser).not.toBeNull();
    expect(foundUser?.id).toBe(user.id);
  });
});

describe(`[${env.DB_TYPE}] Model Manager - With Global Transaction`, () => {
  test("should use model manager within global transaction", async () => {
    const sql = SqlDataSource.instance;
    const manager = sql.getModelManager(UserWithUuid);

    const user = await manager.insert({
      name: "Transaction Test",
      email: `transaction-test-${Date.now()}@example.com`,
      age: 30,
      status: UserStatus.active,
      isActive: true,
    });

    expect(user).toBeDefined();

    // Rollback - user should not exist
    await SqlDataSource.rollbackGlobalTransaction();

    const foundUser = await UserWithUuid.query()
      .where("email", user.email)
      .one();

    expect(foundUser).toBeNull();
  });
});

describe(`[${env.DB_TYPE}] Model Manager - Advanced Operations`, () => {
  test("should perform complex query through model manager", async () => {
    const sql = SqlDataSource.instance;
    const manager = sql.getModelManager(UserWithUuid);

    await UserFactory.userWithUuid(3);

    const users = await manager
      .query()
      .where("age", ">", 25)
      .where("status", "active")
      .orderBy("age", "desc")
      .limit(2)
      .many();

    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeLessThanOrEqual(2);
  });

  test("should perform join query through model manager", async () => {
    const sql = SqlDataSource.instance;
    const manager = sql.getModelManager(UserWithUuid);

    const user = await UserFactory.userWithUuid(1);

    const result = await manager
      .query()
      .join("posts_with_uuid", "users_with_uuid.id", "posts_with_uuid.userId")
      .where("users_with_uuid.id", user.id)
      .many();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe(`[${env.DB_TYPE}] Model Manager - Batch Operations`, () => {
  test("should insert many records through model manager", async () => {
    const sql = SqlDataSource.instance;
    const manager = sql.getModelManager(UserWithUuid);

    const users = await manager.insertMany([
      {
        name: "Batch 1",
        email: `batch1-${Date.now()}@example.com`,
        age: 25,
        status: UserStatus.active,
        isActive: true,
      },
      {
        name: "Batch 2",
        email: `batch2-${Date.now()}@example.com`,
        age: 26,
        status: UserStatus.active,
        isActive: true,
      },
      {
        name: "Batch 3",
        email: `batch3-${Date.now()}@example.com`,
        age: 27,
        status: UserStatus.active,
        isActive: true,
      },
    ]);

    expect(users).toBeDefined();
    expect(users.length).toBe(3);
  });
});
