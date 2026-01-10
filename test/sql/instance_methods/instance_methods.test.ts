import { env } from "../../../src/env/env";
import { HysteriaError } from "../../../src/errors/hysteria_error";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserStatus, UserWithUuid } from "../test_models/uuid/user_uuid";
import { UserWithoutPk } from "../test_models/without_pk/user_without_pk";

beforeAll(async () => {
  const dataSource = new SqlDataSource();
  await dataSource.connect();
});

afterAll(async () => {
  await SqlDataSource.disconnect();
});

beforeEach(async () => {
  await SqlDataSource.startGlobalTransaction();
});

afterEach(async () => {
  await SqlDataSource.rollbackGlobalTransaction();
});

describe(`[${env.DB_TYPE}] Instance Methods - save()`, () => {
  test("should save a new model instance (insert)", async () => {
    const user = new UserWithUuid();
    user.name = "John Doe";
    user.email = "john@example.com";
    user.age = 30;
    user.status = UserStatus.active;
    user.isActive = true;

    await user.save();

    expect(user.id).toBeDefined();
    expect(user.name).toBe("John Doe");
    expect(user.email).toBe("john@example.com");

    const retrievedUser = await UserWithUuid.findOne({
      where: { id: user.id },
    });

    expect(retrievedUser).not.toBeNull();
    expect(retrievedUser?.name).toBe("John Doe");
    expect(retrievedUser?.email).toBe("john@example.com");
  });

  test("should save an existing model instance (update)", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);
    const originalName = insertedUser.name;

    const user = new UserWithUuid();
    user.id = insertedUser.id;
    user.name = "Updated Name";
    user.email = insertedUser.email;
    user.age = insertedUser.age;
    user.status = insertedUser.status;
    user.isActive = insertedUser.isActive;

    await user.save();

    expect(user.name).toBe("Updated Name");
    expect(user.id?.toLowerCase()).toBe(insertedUser.id?.toLowerCase());

    const retrievedUser = await UserWithUuid.findOne({
      where: { id: insertedUser.id },
    });

    expect(retrievedUser).not.toBeNull();
    expect(retrievedUser?.name).toBe("Updated Name");
    expect(retrievedUser?.name).not.toBe(originalName);
  });

  test("should throw error when saving model without primary key", async () => {
    const user = new UserWithoutPk();
    user.name = "John Doe";
    user.email = "john@example.com";

    await expect(user.save()).rejects.toThrow(HysteriaError);
    await expect(user.save()).rejects.toThrow("MODEL_HAS_NO_PRIMARY_KEY");
  });

  test("should save with transaction support", async () => {
    const sql = SqlDataSource.instance;
    const trx = await sql.transaction();

    try {
      const user = new UserWithUuid();
      user.name = "Transaction User";
      user.email = "transaction@example.com";
      user.age = 25;
      user.status = UserStatus.active;
      user.isActive = true;

      await user.save({ trx });

      await trx.commit();
    } catch (error) {
      await trx.rollback();
      throw error;
    }

    const retrievedUser = await UserWithUuid.findOne({
      where: { email: "transaction@example.com" },
    });

    expect(retrievedUser).not.toBeNull();
    expect(retrievedUser?.name).toBe("Transaction User");
  });
});

describe(`[${env.DB_TYPE}] Instance Methods - update()`, () => {
  test("should update model instance with payload", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);
    const originalName = insertedUser.name;

    const user = new UserWithUuid();
    user.id = insertedUser.id;
    user.name = insertedUser.name;
    user.email = insertedUser.email;
    user.age = insertedUser.age;
    user.status = insertedUser.status;
    user.isActive = insertedUser.isActive;

    await user.update({
      name: "Updated Name",
    });

    const retrievedUser = await UserWithUuid.findOne({
      where: { id: insertedUser.id },
    });

    expect(retrievedUser).not.toBeNull();
    expect(retrievedUser?.name).toBe("Updated Name");
    expect(retrievedUser?.name).not.toBe(originalName);
  });

  test("should throw error when updating model without primary key", async () => {
    const user = new UserWithoutPk();
    user.name = "John Doe";
    user.email = "john@example.com";

    await expect(user.update({ name: "Updated Name" })).rejects.toThrow(
      HysteriaError,
    );
    await expect(user.update({ name: "Updated Name" })).rejects.toThrow(
      "MODEL_HAS_NO_PRIMARY_KEY",
    );
  });

  test("should throw error when updating model without primary key value", async () => {
    const user = new UserWithUuid();
    user.name = "John Doe";
    user.email = "john@example.com";
    // id is not set

    await expect(user.update({ name: "Updated Name" })).rejects.toThrow(
      HysteriaError,
    );
    await expect(user.update({ name: "Updated Name" })).rejects.toThrow(
      "MODEL_HAS_NO_PRIMARY_KEY_VALUE",
    );
  });

  test("should update with transaction support", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);
    const sql = SqlDataSource.instance;
    const trx = await sql.transaction();

    try {
      const user = new UserWithUuid();
      user.id = insertedUser.id;
      user.name = insertedUser.name;
      user.email = insertedUser.email;
      user.age = insertedUser.age;
      user.status = insertedUser.status;
      user.isActive = insertedUser.isActive;

      await user.update({ name: "Transaction Updated" }, { trx });

      await trx.commit();
    } catch (error) {
      await trx.rollback();
      throw error;
    }

    const retrievedUser = await UserWithUuid.findOne({
      where: { id: insertedUser.id },
    });

    expect(retrievedUser).not.toBeNull();
    expect(retrievedUser?.name).toBe("Transaction Updated");
  });
});

describe(`[${env.DB_TYPE}] Instance Methods - softDelete()`, () => {
  test("should soft delete a model instance", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = new UserWithUuid();
    user.id = insertedUser.id;
    user.name = insertedUser.name;
    user.email = insertedUser.email;
    user.age = insertedUser.age;
    user.status = insertedUser.status;
    user.isActive = insertedUser.isActive;

    await user.softDelete();

    const retrievedUser = await UserWithUuid.findOne({
      where: { id: insertedUser.id },
    });

    // Should be null because beforeFetch hook filters out soft deleted records
    expect(retrievedUser).toBeNull();

    // But the record should still exist in the database
    const allUsers = await UserWithUuid.query()
      .where("id", insertedUser.id)
      .many({ ignoreHooks: ["beforeFetch"] });

    expect(allUsers.length).toBe(1);
    expect(allUsers[0].deletedAt).not.toBeNull();
  });

  test("should soft delete with custom column and value", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = new UserWithUuid();
    user.id = insertedUser.id;
    user.name = insertedUser.name;
    user.email = insertedUser.email;
    user.age = insertedUser.age;
    user.status = insertedUser.status;
    user.isActive = insertedUser.isActive;

    const customDate = new Date("2024-01-01");
    await user.softDelete({
      column: "deletedAt",
      value: customDate,
    });

    const allUsers = await UserWithUuid.query()
      .where("id", insertedUser.id)
      .many({ ignoreHooks: ["beforeFetch"] });

    expect(allUsers.length).toBe(1);
    expect(allUsers[0].deletedAt).not.toBeNull();
  });

  test("should throw error when soft deleting model without primary key", async () => {
    const user = new UserWithoutPk();
    user.name = "John Doe";
    user.email = "john@example.com";

    await expect(user.softDelete()).rejects.toThrow(HysteriaError);
    await expect(user.softDelete()).rejects.toThrow("MODEL_HAS_NO_PRIMARY_KEY");
  });

  test("should throw error when soft deleting model without primary key value", async () => {
    const user = new UserWithUuid();
    user.name = "John Doe";
    user.email = "john@example.com";
    // id is not set

    await expect(user.softDelete()).rejects.toThrow(HysteriaError);
    await expect(user.softDelete()).rejects.toThrow(
      "MODEL_HAS_NO_PRIMARY_KEY_VALUE",
    );
  });

  test("should soft delete with transaction support", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);
    const sql = SqlDataSource.instance;
    const trx = await sql.transaction();

    try {
      const user = new UserWithUuid();
      user.id = insertedUser.id;
      user.name = insertedUser.name;
      user.email = insertedUser.email;
      user.age = insertedUser.age;
      user.status = insertedUser.status;
      user.isActive = insertedUser.isActive;

      await user.softDelete(undefined, { trx });

      await trx.commit();
    } catch (error) {
      await trx.rollback();
      throw error;
    }

    const retrievedUser = await UserWithUuid.findOne({
      where: { id: insertedUser.id },
    });

    expect(retrievedUser).toBeNull();
  });
});

describe(`[${env.DB_TYPE}] Instance Methods - delete()`, () => {
  test("should delete a model instance", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = new UserWithUuid();
    user.id = insertedUser.id;
    user.name = insertedUser.name;
    user.email = insertedUser.email;
    user.age = insertedUser.age;
    user.status = insertedUser.status;
    user.isActive = insertedUser.isActive;

    await user.delete();

    const retrievedUser = await UserWithUuid.findOne({
      where: { id: insertedUser.id },
    });

    expect(retrievedUser).toBeNull();

    // Verify it's actually deleted (not just soft deleted)
    const allUsers = await UserWithUuid.query()
      .where("id", insertedUser.id)
      .many({ ignoreHooks: ["beforeFetch"] });

    expect(allUsers.length).toBe(0);
  });

  test("should throw error when deleting model without primary key", async () => {
    const user = new UserWithoutPk();
    user.name = "John Doe";
    user.email = "john@example.com";

    await expect(user.delete()).rejects.toThrow(HysteriaError);
    await expect(user.delete()).rejects.toThrow("MODEL_HAS_NO_PRIMARY_KEY");
  });

  test("should throw error when deleting model without primary key value", async () => {
    const user = new UserWithUuid();
    user.name = "John Doe";
    user.email = "john@example.com";
    // id is not set

    await expect(user.delete()).rejects.toThrow(HysteriaError);
    await expect(user.delete()).rejects.toThrow(
      "MODEL_HAS_NO_PRIMARY_KEY_VALUE",
    );
  });

  test("should delete with transaction support", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);
    const sql = SqlDataSource.instance;
    const trx = await sql.transaction();

    try {
      const user = new UserWithUuid();
      user.id = insertedUser.id;
      user.name = insertedUser.name;
      user.email = insertedUser.email;
      user.age = insertedUser.age;
      user.status = insertedUser.status;
      user.isActive = insertedUser.isActive;

      await user.delete({ trx });

      await trx.commit();
    } catch (error) {
      await trx.rollback();
      throw error;
    }

    const retrievedUser = await UserWithUuid.findOne({
      where: { id: insertedUser.id },
    });

    expect(retrievedUser).toBeNull();
  });
});

describe(`[${env.DB_TYPE}] Instance Methods - refresh()`, () => {
  test("should refresh a model instance from database", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);
    const originalName = insertedUser.name;

    // Update the record directly in the database
    await UserWithUuid.updateRecord(insertedUser, {
      name: "Updated Name",
      age: 40,
    });

    // Create a model instance with old data
    const user = new UserWithUuid();
    user.id = insertedUser.id;
    user.name = originalName;
    user.email = insertedUser.email;
    user.age = insertedUser.age;
    user.status = insertedUser.status;
    user.isActive = insertedUser.isActive;

    // Refresh from database
    await user.refresh();

    expect(user.name).toBe("Updated Name");
    if (env.DB_TYPE === "cockroachdb") {
      expect(user.age).toBe("40");
    } else {
      expect(user.age).toBe(40);
    }
    expect(user.id?.toLowerCase()).toBe(insertedUser.id?.toLowerCase());
  });

  test("should throw error when refreshing model without primary key", async () => {
    const user = new UserWithoutPk();
    user.name = "John Doe";
    user.email = "john@example.com";

    await expect(user.refresh()).rejects.toThrow(HysteriaError);
    await expect(user.refresh()).rejects.toThrow("MODEL_HAS_NO_PRIMARY_KEY");
  });

  test("should throw error when refreshing model without primary key value", async () => {
    const user = new UserWithUuid();
    user.name = "John Doe";
    user.email = "john@example.com";
    // id is not set

    await expect(user.refresh()).rejects.toThrow(HysteriaError);
    await expect(user.refresh()).rejects.toThrow(
      "MODEL_HAS_NO_PRIMARY_KEY_VALUE",
    );
  });

  test("should refresh with transaction support", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);
    const sql = SqlDataSource.instance;
    const trx = await sql.transaction();

    try {
      // Update within transaction
      await UserWithUuid.updateRecord(
        insertedUser,
        { name: "Transaction Updated" },
        { trx },
      );

      const user = new UserWithUuid();
      user.id = insertedUser.id;
      user.name = insertedUser.name;
      user.email = insertedUser.email;
      user.age = insertedUser.age;
      user.status = insertedUser.status;
      user.isActive = insertedUser.isActive;

      await user.refresh({ trx });
      expect(user.name).toBe("Transaction Updated");

      await trx.commit();
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  });
});

describe(`[${env.DB_TYPE}] Instance Methods - mergeProps()`, () => {
  test("should merge provided data with model instance", async () => {
    const user = new UserWithUuid();
    user.name = "Original Name";
    user.email = "original@example.com";
    user.age = 25;
    user.status = UserStatus.active;
    user.isActive = true;

    user.mergeProps({
      name: "Merged Name",
      age: 30,
    });

    expect(user.name).toBe("Merged Name");
    expect(user.age).toBe(30);
    expect(user.email).toBe("original@example.com");
    expect(user.status).toBe(UserStatus.active);
    expect(user.isActive).toBe(true);
  });

  test("should merge props on existing model instance from database", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = new UserWithUuid();
    user.id = insertedUser.id;
    user.name = insertedUser.name;
    user.email = insertedUser.email;
    user.age = insertedUser.age;
    user.status = insertedUser.status;
    user.isActive = insertedUser.isActive;

    user.mergeProps({
      name: "Updated via Merge",
      status: UserStatus.inactive,
    });

    expect(user.name).toBe("Updated via Merge");
    expect(user.status).toBe(UserStatus.inactive);
    expect(user.id).toBe(insertedUser.id);
    expect(user.email).toBe(insertedUser.email);
  });

  test("should not affect other properties when merging partial data", async () => {
    const user = new UserWithUuid();
    user.name = "John Doe";
    user.email = "john@example.com";
    user.age = 25;
    user.status = UserStatus.active;
    user.isActive = true;

    user.mergeProps({
      email: "newemail@example.com",
    });

    expect(user.name).toBe("John Doe");
    expect(user.email).toBe("newemail@example.com");
    expect(user.age).toBe(25);
    expect(user.status).toBe(UserStatus.active);
    expect(user.isActive).toBe(true);
  });

  test("should merge props and then save successfully", async () => {
    if (env.DB_TYPE === "mssql") {
      return;
    }

    const user = new UserWithUuid();
    user.name = "Initial Name";
    user.email = "initial@example.com";
    user.age = 20;
    user.status = UserStatus.active;
    user.isActive = true;

    await user.save();
    expect(user.id).toBeDefined();

    user.mergeProps({
      name: "Merged Before Save",
      age: 35,
    });

    await user.save();

    const retrievedUser = await UserWithUuid.findOne({
      where: { id: user.id },
    });

    expect(retrievedUser).not.toBeNull();
    expect(retrievedUser?.name).toBe("Merged Before Save");
    if (env.DB_TYPE === "cockroachdb") {
      expect(retrievedUser?.age).toBe("35");
    } else {
      expect(retrievedUser?.age).toBe(35);
    }
  });
});

describe(`[${env.DB_TYPE}] Instance Methods - Query Results (without select)`, () => {
  test("should have instance methods available on query result from one()", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.query().where("id", insertedUser.id).one();

    expect(user).not.toBeNull();
    expect(typeof user!.mergeProps).toBe("function");
    expect(typeof user!.save).toBe("function");
    expect(typeof user!.update).toBe("function");
    expect(typeof user!.delete).toBe("function");
    expect(typeof user!.refresh).toBe("function");
    expect(typeof user!.softDelete).toBe("function");
  });

  test("should have instance methods available on query result from many()", async () => {
    await UserFactory.userWithUuid(3);

    const users = await UserWithUuid.query().many();

    expect(users.length).toBeGreaterThan(0);
    const user = users[0];
    expect(typeof user.mergeProps).toBe("function");
    expect(typeof user.save).toBe("function");
    expect(typeof user.update).toBe("function");
    expect(typeof user.delete).toBe("function");
    expect(typeof user.refresh).toBe("function");
    expect(typeof user.softDelete).toBe("function");
  });

  test("should be able to use mergeProps on query result", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.query()
      .where("id", insertedUser.id)
      .oneOrFail();

    user.mergeProps({ name: "Merged from Query" });
    expect(user.name).toBe("Merged from Query");
  });

  test("should be able to use update on query result", async () => {
    if (env.DB_TYPE === "mssql") return;

    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.query()
      .where("id", insertedUser.id)
      .oneOrFail();

    await user.update({ name: "Updated from Query" });

    const refreshedUser = await UserWithUuid.findOne({
      where: { id: insertedUser.id },
    });

    expect(refreshedUser?.name).toBe("Updated from Query");
  });

  test("should be able to use save on query result", async () => {
    if (env.DB_TYPE === "mssql") return;

    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.query()
      .where("id", insertedUser.id)
      .oneOrFail();

    user.name = "Saved from Query";
    await user.save();

    const refreshedUser = await UserWithUuid.findOne({
      where: { id: insertedUser.id },
    });

    expect(refreshedUser?.name).toBe("Saved from Query");
  });

  test("should be able to use refresh on query result", async () => {
    if (env.DB_TYPE === "mssql") return;

    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.query()
      .where("id", insertedUser.id)
      .oneOrFail();

    await UserWithUuid.updateRecord(user as UserWithUuid, {
      name: "DB Updated",
    });

    await user.refresh();
    expect(user.name).toBe("DB Updated");
  });

  test("should be able to use delete on query result", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.query()
      .where("id", insertedUser.id)
      .oneOrFail();

    await user.delete();

    const deletedUser = await UserWithUuid.query()
      .where("id", insertedUser.id)
      .many({ ignoreHooks: ["beforeFetch"] });

    expect(deletedUser.length).toBe(0);
  });

  test("should be able to use softDelete on query result", async () => {
    if (env.DB_TYPE === "mssql") return;

    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.query()
      .where("id", insertedUser.id)
      .oneOrFail();

    await user.softDelete();

    const softDeletedUser = await UserWithUuid.findOne({
      where: { id: insertedUser.id },
    });

    expect(softDeletedUser).toBeNull();

    const allUsers = await UserWithUuid.query()
      .where("id", insertedUser.id)
      .many({ ignoreHooks: ["beforeFetch"] });

    expect(allUsers.length).toBe(1);
    expect(allUsers[0].deletedAt).not.toBeNull();
  });
});

describe(`[${env.DB_TYPE}] Instance Methods - Query Results (with select)`, () => {
  test("should have instance methods available when using select()", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.query()
      .select("id", "name", "email")
      .where("id", insertedUser.id)
      .one();

    expect(user).not.toBeNull();
    expect(typeof user!.mergeProps).toBe("function");
    expect(typeof user!.save).toBe("function");
    expect(typeof user!.update).toBe("function");
    expect(typeof user!.delete).toBe("function");
    expect(typeof user!.refresh).toBe("function");
    expect(typeof user!.softDelete).toBe("function");
  });

  test("should have instance methods available when using select with aliases", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.query()
      .select("id", ["name", "userName"], ["email", "userEmail"])
      .where("id", insertedUser.id)
      .one();

    expect(user).not.toBeNull();
    expect(typeof user!.mergeProps).toBe("function");
    expect(typeof user!.save).toBe("function");
    expect(typeof user!.update).toBe("function");
    expect(typeof user!.delete).toBe("function");
    expect(typeof user!.refresh).toBe("function");
    expect(typeof user!.softDelete).toBe("function");
  });

  test("should be able to use update on query result with select", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.query()
      .select("id", "name")
      .where("id", insertedUser.id)
      .oneOrFail();

    await user.update({ name: "Updated with Select" });

    const refreshedUser = await UserWithUuid.findOne({
      where: { id: insertedUser.id },
    });

    expect(refreshedUser?.name).toBe("Updated with Select");
  });

  test("should be able to use save on query result with select", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.query()
      .select("id", "name", "email", "age", "status", "isActive")
      .where("id", insertedUser.id)
      .oneOrFail();

    user.name = "Saved with Select";
    await user.save();

    const refreshedUser = await UserWithUuid.findOne({
      where: { id: insertedUser.id },
    });

    expect(refreshedUser?.name).toBe("Saved with Select");
  });

  test("should be able to use delete on query result with select", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.query()
      .select("id", "name")
      .where("id", insertedUser.id)
      .oneOrFail();

    await user.delete();

    const deletedUser = await UserWithUuid.query()
      .where("id", insertedUser.id)
      .many({ ignoreHooks: ["beforeFetch"] });

    expect(deletedUser.length).toBe(0);
  });

  test("should be able to use refresh on query result with select", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.query()
      .select("id", "name")
      .where("id", insertedUser.id)
      .oneOrFail();

    await UserWithUuid.updateRecord({ id: insertedUser.id } as UserWithUuid, {
      name: "DB Updated Select",
    });

    await user.refresh();
    expect(user.name).toBe("DB Updated Select");
  });

  test("should be able to use softDelete on query result with select", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.query()
      .select("id", "name")
      .where("id", insertedUser.id)
      .oneOrFail();

    await user.softDelete();

    const softDeletedUser = await UserWithUuid.findOne({
      where: { id: insertedUser.id },
    });

    expect(softDeletedUser).toBeNull();
  });

  test("should be able to use mergeProps on query result with select", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.query()
      .select("id", "name", "email")
      .where("id", insertedUser.id)
      .oneOrFail();

    user.mergeProps({ name: "Merged with Select" });
    expect(user.name).toBe("Merged with Select");
  });

  test("should work with selectRaw and instance methods", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.query()
      .select("id", "name")
      .selectRaw<{ customField: string }>("'test' as customField")
      .where("id", insertedUser.id)
      .oneOrFail();

    // Verify instance methods are available
    expect(typeof user.mergeProps).toBe("function");
    expect(typeof user.save).toBe("function");
    expect(typeof user.update).toBe("function");
    expect(typeof user.delete).toBe("function");
    expect(typeof user.refresh).toBe("function");
    expect(typeof user.softDelete).toBe("function");

    // Verify selectRaw data is present
    expect(user.customField).toBe("test");
  });
});

describe(`[${env.DB_TYPE}] Instance Methods - Static Find Methods`, () => {
  test("should have instance methods on Model.findOne() result", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.findOne({
      where: { id: insertedUser.id },
    });

    expect(user).not.toBeNull();
    expect(typeof user!.mergeProps).toBe("function");
    expect(typeof user!.save).toBe("function");
    expect(typeof user!.update).toBe("function");
    expect(typeof user!.delete).toBe("function");
    expect(typeof user!.refresh).toBe("function");
    expect(typeof user!.softDelete).toBe("function");
  });

  test("should have instance methods on Model.findOne() with select", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.findOne({
      select: ["id", "name", "email"],
      where: { id: insertedUser.id },
    });

    expect(user).not.toBeNull();
    expect(typeof user!.mergeProps).toBe("function");
    expect(typeof user!.save).toBe("function");
    expect(typeof user!.update).toBe("function");
    expect(typeof user!.delete).toBe("function");
    expect(typeof user!.refresh).toBe("function");
    expect(typeof user!.softDelete).toBe("function");
  });

  test("should be able to use update on Model.findOne() result", async () => {
    if (env.DB_TYPE === "mssql") return;

    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.findOne({
      where: { id: insertedUser.id },
    });

    expect(user).not.toBeNull();
    await user!.update({ name: "Updated via findOne" });

    const refreshedUser = await UserWithUuid.findOne({
      where: { id: insertedUser.id },
    });

    expect(refreshedUser?.name).toBe("Updated via findOne");
  });

  test("should have instance methods on Model.findOneOrFail() result", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.findOneOrFail({
      where: { id: insertedUser.id },
    });

    expect(typeof user.mergeProps).toBe("function");
    expect(typeof user.save).toBe("function");
    expect(typeof user.update).toBe("function");
    expect(typeof user.delete).toBe("function");
    expect(typeof user.refresh).toBe("function");
    expect(typeof user.softDelete).toBe("function");
  });

  test("should be able to use delete on Model.findOneOrFail() result", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.findOneOrFail({
      where: { id: insertedUser.id },
    });

    await user.delete();

    const deletedUser = await UserWithUuid.query()
      .where("id", insertedUser.id)
      .many({ ignoreHooks: ["beforeFetch"] });

    expect(deletedUser.length).toBe(0);
  });

  test("should have instance methods on Model.find() results", async () => {
    await UserFactory.userWithUuid(3);

    const users = await UserWithUuid.find({});

    expect(users.length).toBeGreaterThan(0);
    const user = users[0];
    expect(typeof user.mergeProps).toBe("function");
    expect(typeof user.save).toBe("function");
    expect(typeof user.update).toBe("function");
    expect(typeof user.delete).toBe("function");
    expect(typeof user.refresh).toBe("function");
    expect(typeof user.softDelete).toBe("function");
  });

  test("should have instance methods on Model.find() with select", async () => {
    await UserFactory.userWithUuid(3);

    const users = await UserWithUuid.find({
      select: ["id", "name"],
    });

    expect(users.length).toBeGreaterThan(0);
    const user = users[0];
    expect(typeof user.mergeProps).toBe("function");
    expect(typeof user.save).toBe("function");
    expect(typeof user.update).toBe("function");
  });

  test("should be able to use softDelete on Model.find() result", async () => {
    if (env.DB_TYPE === "mssql") return;

    const insertedUser = await UserFactory.userWithUuid(1);

    const users = await UserWithUuid.find({
      where: { id: insertedUser.id },
    });

    expect(users.length).toBe(1);
    await users[0].softDelete();

    const softDeletedUser = await UserWithUuid.findOne({
      where: { id: insertedUser.id },
    });

    expect(softDeletedUser).toBeNull();
  });

  test("should have instance methods on Model.findBy() results", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const users = await UserWithUuid.findBy("id", insertedUser.id!);

    expect(users.length).toBe(1);
    const user = users[0];
    expect(typeof user.mergeProps).toBe("function");
    expect(typeof user.save).toBe("function");
    expect(typeof user.update).toBe("function");
    expect(typeof user.delete).toBe("function");
    expect(typeof user.refresh).toBe("function");
    expect(typeof user.softDelete).toBe("function");
  });

  test("should be able to use refresh on Model.findBy() result", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const users = await UserWithUuid.findBy("id", insertedUser.id!);

    expect(users.length).toBe(1);
    const user = users[0];

    await UserWithUuid.updateRecord({ id: insertedUser.id } as UserWithUuid, {
      name: "Updated in DB",
    });

    await user.refresh();
    expect(user.name).toBe("Updated in DB");
  });

  test("should have instance methods on Model.findOneBy() result", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.findOneBy("id", insertedUser.id!);

    expect(user).not.toBeNull();
    expect(typeof user!.mergeProps).toBe("function");
    expect(typeof user!.save).toBe("function");
    expect(typeof user!.update).toBe("function");
    expect(typeof user!.delete).toBe("function");
    expect(typeof user!.refresh).toBe("function");
    expect(typeof user!.softDelete).toBe("function");
  });

  test("should be able to use update on Model.findOneBy() result", async () => {
    if (env.DB_TYPE === "mssql") return;

    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.findOneBy("id", insertedUser.id!);

    expect(user).not.toBeNull();
    await user!.update({ name: "Updated via findOneBy" });

    const refreshedUser = await UserWithUuid.findOne({
      where: { id: insertedUser.id },
    });

    expect(refreshedUser?.name).toBe("Updated via findOneBy");
  });

  test("should have instance methods on Model.findOneByPrimaryKey() result", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.findOneByPrimaryKey(insertedUser.id!);

    expect(user).not.toBeNull();
    expect(typeof user!.mergeProps).toBe("function");
    expect(typeof user!.save).toBe("function");
    expect(typeof user!.update).toBe("function");
    expect(typeof user!.delete).toBe("function");
    expect(typeof user!.refresh).toBe("function");
    expect(typeof user!.softDelete).toBe("function");
  });

  test("should be able to use save on Model.findOneByPrimaryKey() result", async () => {
    if (env.DB_TYPE === "mssql") return;

    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.findOneByPrimaryKey(insertedUser.id!);

    expect(user).not.toBeNull();
    user!.name = "Saved via findOneByPrimaryKey";
    await user!.save();

    const refreshedUser = await UserWithUuid.findOne({
      where: { id: insertedUser.id },
    });

    expect(refreshedUser?.name).toBe("Saved via findOneByPrimaryKey");
  });

  test("should have instance methods on Model.all() results", async () => {
    await UserFactory.userWithUuid(3);

    const users = await UserWithUuid.all();

    expect(users.length).toBeGreaterThan(0);
    const user = users[0];
    expect(typeof user.mergeProps).toBe("function");
    expect(typeof user.save).toBe("function");
    expect(typeof user.update).toBe("function");
    expect(typeof user.delete).toBe("function");
    expect(typeof user.refresh).toBe("function");
    expect(typeof user.softDelete).toBe("function");
  });

  test("should be able to use delete on Model.all() result", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const users = await UserWithUuid.all();
    const userToDelete = users.find(
      (u) => u.id?.toLowerCase() === insertedUser.id?.toLowerCase(),
    );

    expect(userToDelete).toBeDefined();
    await userToDelete!.delete();

    const deletedUser = await UserWithUuid.query()
      .where("id", insertedUser.id!)
      .many({ ignoreHooks: ["beforeFetch"] });

    expect(deletedUser.length).toBe(0);
  });

  test("should have instance methods on Model.first() result", async () => {
    await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.first();

    expect(user).not.toBeNull();
    expect(typeof user!.mergeProps).toBe("function");
    expect(typeof user!.save).toBe("function");
    expect(typeof user!.update).toBe("function");
    expect(typeof user!.delete).toBe("function");
    expect(typeof user!.refresh).toBe("function");
    expect(typeof user!.softDelete).toBe("function");
  });

  test("should be able to use mergeProps and save on Model.first() result", async () => {
    if (env.DB_TYPE === "mssql") return;

    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.first();

    expect(user).not.toBeNull();
    user!.mergeProps({ name: "Merged via first" });
    await user!.save();

    const refreshedUser = await UserWithUuid.findOne({
      where: { id: insertedUser.id },
    });

    expect(refreshedUser?.name).toBe("Merged via first");
  });

  test("should have instance methods on Model.insert() result", async () => {
    const user = await UserWithUuid.insert({
      name: "Insert Test",
      email: "insert@test.com",
      age: 25,
      status: UserStatus.active,
      isActive: true,
    });

    expect(user.id).toBeDefined();
    expect(typeof user.mergeProps).toBe("function");
    expect(typeof user.save).toBe("function");
    expect(typeof user.update).toBe("function");
    expect(typeof user.delete).toBe("function");
    expect(typeof user.refresh).toBe("function");
    expect(typeof user.softDelete).toBe("function");
  });

  test("should be able to use update on Model.insert() result", async () => {
    const user = await UserWithUuid.insert({
      name: "Insert Then Update",
      email: "insertupdate@test.com",
      age: 25,
      status: UserStatus.active,
      isActive: true,
    });

    await user.update({ name: "Updated After Insert" });

    const refreshedUser = await UserWithUuid.findOne({
      where: { id: user.id },
    });

    expect(refreshedUser?.name).toBe("Updated After Insert");
  });

  test("should have instance methods on Model.insertMany() results", async () => {
    const users = await UserWithUuid.insertMany([
      {
        name: "Batch User 1",
        email: "batch1@test.com",
        age: 25,
        status: UserStatus.active,
        isActive: true,
      },
      {
        name: "Batch User 2",
        email: "batch2@test.com",
        age: 30,
        status: UserStatus.active,
        isActive: true,
      },
    ]);

    expect(users.length).toBe(2);
    for (const user of users) {
      expect(typeof user.mergeProps).toBe("function");
      expect(typeof user.save).toBe("function");
      expect(typeof user.update).toBe("function");
      expect(typeof user.delete).toBe("function");
      expect(typeof user.refresh).toBe("function");
      expect(typeof user.softDelete).toBe("function");
    }
  });

  test("should have instance methods on Model.upsert() result", async () => {
    const user = await UserWithUuid.upsert(
      { email: "upsert@test.com" },
      {
        name: "Upsert User",
        email: "upsert@test.com",
        age: 25,
        status: UserStatus.active,
        isActive: true,
      },
    );

    expect(user.id).toBeDefined();
    expect(typeof user.mergeProps).toBe("function");
    expect(typeof user.save).toBe("function");
    expect(typeof user.update).toBe("function");
    expect(typeof user.delete).toBe("function");
    expect(typeof user.refresh).toBe("function");
    expect(typeof user.softDelete).toBe("function");
  });

  test("should be able to use refresh on Model.upsert() result", async () => {
    const user = await UserWithUuid.upsert(
      { email: "upsertrefresh@test.com" },
      {
        name: "Upsert Refresh User",
        email: "upsertrefresh@test.com",
        age: 25,
        status: UserStatus.active,
        isActive: true,
      },
    );

    await UserWithUuid.updateRecord({ id: user.id } as UserWithUuid, {
      name: "Updated in DB after upsert",
    });

    await user.refresh();
    expect(user.name).toBe("Updated in DB after upsert");
  });

  test("should have instance methods on Model.updateRecord() result", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.updateRecord(
      { id: insertedUser.id } as UserWithUuid,
      { name: "Updated Record" },
    );

    expect(typeof user.mergeProps).toBe("function");
    expect(typeof user.save).toBe("function");
    expect(typeof user.update).toBe("function");
    expect(typeof user.delete).toBe("function");
    expect(typeof user.refresh).toBe("function");
    expect(typeof user.softDelete).toBe("function");
  });

  test("should be able to chain operations on Model.updateRecord() result", async () => {
    if (env.DB_TYPE === "mssql") return;

    const insertedUser = await UserFactory.userWithUuid(1);

    const user = await UserWithUuid.updateRecord(
      { id: insertedUser.id } as UserWithUuid,
      { name: "First Update" },
    );

    await user.update({ name: "Second Update" });

    const refreshedUser = await UserWithUuid.findOne({
      where: { id: insertedUser.id },
    });

    expect(refreshedUser?.name).toBe("Second Update");
  });
});

describe(`[${env.DB_TYPE}] Instance Methods - Integration Tests`, () => {
  test("should chain instance methods correctly", async () => {
    if (env.DB_TYPE === "mssql") {
      return;
    }

    const user = new UserWithUuid();
    user.name = "Chain Test";
    user.email = "chain@example.com";
    user.age = 25;
    user.status = UserStatus.active;
    user.isActive = true;

    await user.save();
    expect(user.id).toBeDefined();

    await user.update({ name: "Chain Updated" });
    expect(user.name).toBe("Chain Updated");

    await UserWithUuid.updateRecord(user, { age: 50 });
    await user.refresh();
    if (env.DB_TYPE === "cockroachdb") {
      expect(user.age).toBe("50");
    } else {
      expect(user.age).toBe(50);
    }

    await user.softDelete();
    const retrievedUser = await UserWithUuid.findOne({
      where: { id: user.id },
    });
    expect(retrievedUser).toBeNull();
  });

  test("should handle save after update", async () => {
    const insertedUser = await UserFactory.userWithUuid(1);

    const user = new UserWithUuid();
    user.id = insertedUser.id;
    user.name = insertedUser.name;
    user.email = insertedUser.email;
    user.age = insertedUser.age;
    user.status = insertedUser.status;
    user.isActive = insertedUser.isActive;

    // Update using instance method
    await user.update({ name: "First Update" });
    expect(user.name).toBe("First Update");

    // Modify and save
    user.name = "Second Update";
    await user.save();

    const retrievedUser = await UserWithUuid.findOne({
      where: { id: insertedUser.id },
    });

    expect(retrievedUser?.name).toBe("Second Update");
  });
});
