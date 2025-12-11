import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserStatus, UserWithBigint } from "../test_models/bigint/user_bigint";
import { UserFactory } from "../test_models/factory/user_factory";

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

describe(`[${env.DB_TYPE}] Select`, () => {
  test("lockForUpdate", async () => {
    if (env.DB_TYPE === "sqlite") {
      console.log("Sqlite does not support lockForUpdate");
      return;
    }

    await UserFactory.userWithBigint(2);
    const users = await UserWithBigint.query().lockForUpdate().many();
    expect(users.length).toBe(2);
    expect(users[0]).not.toBeUndefined();
    expect(users[1]).not.toBeUndefined();

    const users2 = await UserWithBigint.query()
      .lockForUpdate({
        skipLocked: true,
      })
      .many();
    expect(users2.length).toBe(2);
    expect(users2[0]).not.toBeUndefined();
    expect(users2[1]).not.toBeUndefined();
  });

  test("forShare", async () => {
    if (env.DB_TYPE === "sqlite") {
      console.log("Sqlite does not support lockForUpdate");
      return;
    }

    await UserFactory.userWithBigint(2);
    const users = await UserWithBigint.query().forShare().many();
    expect(users.length).toBe(2);
    expect(users[0]).not.toBeUndefined();
    expect(users[1]).not.toBeUndefined();
  });

  test("pluck", async () => {
    await UserFactory.userWithBigint(2);
    const users = await UserWithBigint.query().pluck("name");
    expect(users.length).toBe(2);
    expect(users[0]).not.toBeUndefined();
    expect(users[1]).not.toBeUndefined();
  });

  test("increment", async () => {
    const user = await UserFactory.userWithBigint(1);
    const originalAge = user.age;
    await UserWithBigint.query().increment("age", 1);

    const updatedUser = await UserWithBigint.query().first();
    expect(Number(updatedUser?.age)).toBe(Number(originalAge) + 1);
  });

  test("decrement", async () => {
    const user = await UserFactory.userWithBigint(1);
    const originalAge = user.age;
    await UserWithBigint.query().decrement("age", 1);

    const updatedUser = await UserWithBigint.query().first();

    expect(Number(updatedUser?.age)).toBe(Number(originalAge) - 1);
  });

  test("Select all without `select` method call (default behavior)", async () => {
    await UserFactory.userWithBigint(2);
    const users = await UserWithBigint.query().many();
    expect(users.length).toBe(2);
    expect(users[0].name).not.toBeUndefined();
    expect(users[1].name).not.toBeUndefined();
  });

  test("Select all", async () => {
    await UserFactory.userWithBigint(2);
    const users = await UserWithBigint.query().select("*").many();
    expect(users.length).toBe(2);
    expect(users[0].name).not.toBeUndefined();
    expect(users[1].name).not.toBeUndefined();
  });

  test("Multiple select", async () => {
    await UserFactory.userWithBigint(2);
    const users = await UserWithBigint.query()
      .select("name")
      .select("age")
      .many();

    expect(users.length).toBe(2);
    expect(users[0].name).not.toBeUndefined();
    expect(users[1].name).not.toBeUndefined();
    expect(users[0].age).not.toBeUndefined();
    expect(users[1].age).not.toBeUndefined();
  });

  test("clear select", async () => {
    await UserFactory.userWithBigint(2);
    const users = await UserWithBigint.query()
      .select("name")
      .clearSelect()
      .many();

    expect(users.length).toBe(2);
    expect(users[0].name).not.toBeUndefined();
    expect(users[1].name).not.toBeUndefined();
    expect(users[0].age).not.toBeUndefined();
    expect(users[1].age).not.toBeUndefined();
  });

  test("Pagination", async () => {
    await UserFactory.userWithBigint(10);
    const users = await UserWithBigint.query().paginate(1, 5);
    expect(users.data.length).toBe(5);
    expect(users.paginationMetadata.total).toBe(10);
    expect(users.paginationMetadata.currentPage).toBe(1);
    expect(users.paginationMetadata.lastPage).toBe(2);
  });

  test("Multiple columns select", async () => {
    await UserFactory.userWithBigint(2);
    const users = await UserWithBigint.query()
      .select("age", "birthDate")
      .many();
    expect(users.length).toBe(2);
    expect(users[0].age).not.toBeUndefined();
    expect(users[1].age).not.toBeUndefined();
    expect(users[0].birthDate).not.toBeUndefined();
    expect(users[1].birthDate).not.toBeUndefined();
    expect(Object.keys(users[0]).length).toBe(2); // age, birthDate
    expect(Object.keys(users[1]).length).toBe(2);
  });

  test("Multiple columns select with aliases", async () => {
    await UserFactory.userWithBigint(2);
    const users = await UserWithBigint.query()
      .annotate("age", "testAge")
      .annotate("birthDate", "testBirth")
      .many();

    expect(users.length).toBe(2);
    expect(users[0].$annotations.testAge).not.toBeUndefined();
    expect(users[1].$annotations.testBirth).not.toBeUndefined();
    expect(users[0].$annotations.testAge).not.toBeUndefined();
    expect(users[1].$annotations.testBirth).not.toBeUndefined();
    expect(Object.keys(users[0]).length).toBe(1); // $annotations
    expect(Object.keys(users[1]).length).toBe(1);
  });
});

describe(`[${env.DB_TYPE}] Basic Cruds`, () => {
  test("should create an user", async () => {
    const user = await UserFactory.userWithBigint(1);
    const retrievedUser = await UserWithBigint.findOne({
      where: {
        email: user.email,
      },
    });

    expect(retrievedUser).not.toBeNull();
    expect(user).toHaveProperty("id");
    expect(user).toHaveProperty("name");
    expect(user).toHaveProperty("email");
  });

  test("should update an user", async () => {
    if (env.DB_TYPE === "cockroachdb") {
      console.log("CockroachDB breaks on bigint pk update");
      return;
    }

    const user = await UserFactory.userWithBigint(1);
    const updatedUser = await UserWithBigint.updateRecord({
      ...user,
      name: "John Doe",
    });

    expect(updatedUser.name).toBe("John Doe");
    expect(updatedUser.id).toBe(user.id);
    expect(updatedUser.updatedAt).not.toBeNull();
    expect(updatedUser.updatedAt).not.toBe(user.updatedAt);
    expect(updatedUser.createdAt).not.toBeNull();
  });

  test("should delete an user", async () => {
    const user = await UserFactory.userWithBigint(1);
    await UserWithBigint.deleteRecord(user);

    const deletedUser = await UserWithBigint.findOne({
      where: { id: user.id },
    });

    expect(deletedUser).toBeNull();
  });

  test("should create multiple users", async () => {
    const users = await UserFactory.userWithBigint(2);

    expect(users).toHaveLength(2);
    users.forEach((user) => {
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("email");
    });
  });

  test("should find users by name pattern", async () => {
    await UserFactory.userWithBigint(3);
    const allUsers = await UserWithBigint.find();
    expect(allUsers.length).toBe(3);
  });

  test("should find one user by email", async () => {
    const user1 = await UserFactory.userWithBigint(1);
    await UserFactory.userWithBigint(1);

    const foundUser = await UserWithBigint.findOne({
      where: { email: user1.email },
    });

    expect(foundUser).not.toBeNull();
    expect(foundUser?.email).toBe(user1.email);
  });

  test("should handle empty results gracefully", async () => {
    await UserFactory.userWithBigint(1);

    const users = await UserWithBigint.find({
      where: { name: "NonExistent" },
    });
    expect(users).toHaveLength(0);

    const user = await UserWithBigint.findOne({
      where: { email: "nonexistent@example.com" },
    });
    expect(user).toBeNull();
  });

  test("should throw error when trying to findOneOrFail with non-existent criteria", async () => {
    await UserFactory.userWithBigint(1);

    await expect(
      UserWithBigint.findOneOrFail({
        where: { email: "nonexistent@example.com" },
      }),
    ).rejects.toThrow();
  });

  test("should handle firstOrInsert operation", async () => {
    const existingUser = await UserFactory.userWithBigint(1);

    const foundUser = await UserWithBigint.firstOrInsert(
      { email: existingUser.email },
      { name: "Different Name", email: existingUser.email },
    );

    expect(foundUser.name).toBe(existingUser.name);
    expect(foundUser.email).toBe(existingUser.email);

    const newUser = await UserWithBigint.firstOrInsert(
      { email: "new@example.com" },
      { name: "New User", email: "new@example.com", status: UserStatus.active },
    );

    expect(newUser.name).toBe("New User");
    expect(newUser.email).toBe("new@example.com");
  });

  test("should handle different user statuses", async () => {
    const activeUser = await UserFactory.userWithBigint(1, UserStatus.active);
    const inactiveUser = await UserFactory.userWithBigint(
      1,
      UserStatus.inactive,
    );

    expect(activeUser.status).toBe(UserStatus.active);
    expect(inactiveUser.status).toBe(UserStatus.inactive);

    const activeUsers = await UserWithBigint.find({
      where: { status: UserStatus.active },
    });

    expect(activeUsers).toHaveLength(1);

    const inactiveUsers = await UserWithBigint.find({
      where: { status: UserStatus.inactive },
    });
    expect(inactiveUsers).toHaveLength(1);
  });

  test("should firstOrInsert (read) an user", async () => {
    const existingUser = await UserFactory.userWithBigint(1);

    const foundUser = await UserWithBigint.firstOrInsert(
      { email: existingUser.email },
      { name: "Different Name", email: existingUser.email },
    );

    const newUser = await UserWithBigint.findOne({
      where: { email: existingUser.email },
    });

    const allUsers = await UserWithBigint.find();
    expect(foundUser).toHaveProperty("id");
    expect(newUser).not.toBeNull();
    expect(newUser?.email).toBe(existingUser.email);
    expect(allUsers).toHaveLength(1);
  });

  test("should firstOrInsert (create) an user", async () => {
    const foundUser = await UserWithBigint.firstOrInsert(
      { email: "" },
      { ...UserFactory.getCommonUserData() },
    );

    const allUsers = await UserWithBigint.find();
    expect(foundUser).toHaveProperty("id");
    expect(allUsers).toHaveLength(1);
  });

  test("should update user via bulk update", async () => {
    const user = await UserFactory.userWithBigint(1);
    await UserWithBigint.query().update({
      name: "John Doe",
    });

    const allUsers = await UserWithBigint.find();
    expect(allUsers).toHaveLength(1);
    expect(allUsers[0].name).toBe("John Doe");
    expect(allUsers[0].updatedAt).not.toBe(allUsers[0].createdAt);
    expect(allUsers[0].updatedAt).not.toBe(user.updatedAt);
  });
});

describe(`[${env.DB_TYPE}] upsert`, () => {
  test("should upsert an user with insert and updateOnConflict", async () => {
    const insertedUser = await UserWithBigint.upsert(
      { email: "test@test.com" },
      { name: "John Doe", email: "test@test.com" },
    );

    console.log(insertedUser);
    expect(insertedUser.name).toBe("John Doe");
    expect(insertedUser.email).toBe("test@test.com");
  });

  test("should upsert an user with update and updateOnConflict", async () => {
    if (env.DB_TYPE === "cockroachdb") {
      console.log("CockroachDB breaks on bigint pk update");
      return;
    }

    const user = await UserFactory.userWithBigint(1);
    const updatedUser = await UserWithBigint.upsert(
      { email: user.email },
      { name: "John Doe", email: user.email },
    );
    expect(updatedUser.name).toBe("John Doe");
    expect(updatedUser.email).toBe(user.email);
  });

  test("should upsert an user with insert and ignoreOnConflict", async () => {
    const insertedUser = await UserWithBigint.upsert(
      { email: "test@test.com" },
      { name: "John Doe", email: "test@test.com" },
      { updateOnConflict: false },
    );
    expect(insertedUser.name).toBe("John Doe");
    expect(insertedUser.email).toBe("test@test.com");
  });

  test("should upsert an user with update and ignoreOnConflict", async () => {
    const user = await UserFactory.userWithBigint(1);
    const updatedUser = await UserWithBigint.upsert(
      { email: user.email },
      { name: "John Doe", email: user.email },
      { updateOnConflict: false },
    );
    expect(updatedUser.name).toBe(user.name);
    expect(updatedUser.email).toBe(user.email);
  });

  test("should upsert many users with insert and updateOnConflict with returning", async () => {
    const insertedUser = await UserWithBigint.upsert(
      { email: "test@test.com" },
      { name: "John Doe", email: "test@test.com" },
      { updateOnConflict: true, returning: ["name"] },
    );
    expect(insertedUser.name).toBe("John Doe");
    if (env.DB_TYPE !== "sqlite") {
      expect(insertedUser.email).not.toBeDefined();
    }
  });

  test("should upsert an user with update and updateOnConflict with returning", async () => {
    if (env.DB_TYPE === "cockroachdb") {
      console.log("CockroachDB breaks on bigint pk update");
      return;
    }

    const user = await UserFactory.userWithBigint(1);
    const updatedUser = await UserWithBigint.upsert(
      { email: user.email },
      { name: "John Doe", email: user.email },
      { updateOnConflict: true, returning: ["name"] },
    );
    expect(updatedUser.name).toBe("John Doe");
    expect(updatedUser.email).not.toBeDefined();
  });
});

describe(`[${env.DB_TYPE}] upsertMany`, () => {
  test("should upsert many users with insert and updateOnConflict", async () => {
    const insertedUsers = await UserWithBigint.upsertMany(
      ["email"],
      [
        { email: "test@test.com", name: "John Doe" },
        { email: "test2@test.com", name: "John Doe 2" },
      ],
    );

    expect(insertedUsers).toHaveLength(2);
    expect(insertedUsers[0].name).toMatch(/John Doe|John Doe 2/);
    expect(insertedUsers[0].email).toMatch(/test@test.com|test2@test.com/);
    expect(insertedUsers[1].name).toMatch(/John Doe|John Doe 2/);
    expect(insertedUsers[1].email).toMatch(/test@test.com|test2@test.com/);
  });

  test("should upsert many users with update and updateOnConflict", async () => {
    const users = await UserFactory.userWithBigint(2);
    const updatedUsers = await UserWithBigint.upsertMany(
      ["email"],
      [
        { email: users[0].email, name: "John Doe", isActive: true },
        { email: users[1].email, name: "John Doe 2", isActive: false },
      ],
    );

    expect(updatedUsers).toHaveLength(2);
    expect(updatedUsers[0].name).toMatch(/John Doe|John Doe 2/);
    expect(updatedUsers[0].email).toMatch(
      new RegExp(`${users[0].email}|${users[1].email}`),
    );
    expect(updatedUsers[1].name).toMatch(/John Doe|John Doe 2/);
    expect(updatedUsers[1].email).toMatch(
      new RegExp(`${users[0].email}|${users[1].email}`),
    );
  });

  test("should upsert many users with insert and updateOnConflict with returning", async () => {
    const insertedUsers = await UserWithBigint.upsertMany(
      ["email"],
      [
        { email: "test@test.com", name: "John Doe" },
        { email: "test2@test.com", name: "John Doe 2" },
      ],
      { updateOnConflict: true, returning: ["name"] },
    );

    expect(insertedUsers).toHaveLength(2);
    expect(insertedUsers[0].name).toMatch(/John Doe|John Doe 2/);
    if (env.DB_TYPE !== "sqlite") {
      expect(insertedUsers[0].email).not.toBeDefined();
    }
    expect(insertedUsers[1].name).toMatch(/John Doe|John Doe 2/);
    if (env.DB_TYPE !== "sqlite") {
      expect(insertedUsers[1].email).not.toBeDefined();
    }
  });
});
