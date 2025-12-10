import { env } from "../../../src/env/env";
import { HysteriaError } from "../../../src/errors/hysteria_error";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserStatus, UserWithUuid } from "../test_models/uuid/user_uuid";
import { UserWithoutPk } from "../test_models/without_pk/user_without_pk";

beforeAll(async () => {
  await SqlDataSource.connect();
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
    expect(user.id).toBe(insertedUser.id);

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
    const sql = SqlDataSource.getInstance();
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
    const sql = SqlDataSource.getInstance();
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
    const sql = SqlDataSource.getInstance();
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
    const sql = SqlDataSource.getInstance();
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
    expect(user.id).toBe(insertedUser.id);
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
    const sql = SqlDataSource.getInstance();
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

describe(`[${env.DB_TYPE}] Instance Methods - Integration Tests`, () => {
  test("should chain instance methods correctly", async () => {
    // Create
    const user = new UserWithUuid();
    user.name = "Chain Test";
    user.email = "chain@example.com";
    user.age = 25;
    user.status = UserStatus.active;
    user.isActive = true;

    await user.save();
    expect(user.id).toBeDefined();

    // Update
    await user.update({ name: "Chain Updated" });
    expect(user.name).toBe("Chain Updated");

    // Refresh
    await UserWithUuid.updateRecord(user, { age: 50 });
    await user.refresh();
    if (env.DB_TYPE === "cockroachdb") {
      expect(user.age).toBe("50");
    } else {
      expect(user.age).toBe(50);
    }

    // Soft delete
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
