import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserStatus, UserWithBigint } from "../test_models/bigint/user_bigint";

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

describe(`[${env.DB_TYPE}] Select`, () => {
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
      .select("age as test_age", "birthDate as test_birth")
      .many();

    expect(users.length).toBe(2);
    expect(users[0].$additional.testAge).not.toBeUndefined();
    expect(users[1].$additional.testBirth).not.toBeUndefined();
    expect(users[0].$additional.testAge).not.toBeUndefined();
    expect(users[1].$additional.testBirth).not.toBeUndefined();
    expect(Object.keys(users[0]).length).toBe(1); // $additional
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
    expect(updatedUser.createdAt).toStrictEqual(user.createdAt);
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

  test("should handle firstOrCreate operation", async () => {
    const existingUser = await UserFactory.userWithBigint(1);

    const foundUser = await UserWithBigint.firstOrCreate(
      { email: existingUser.email },
      { name: "Different Name", email: existingUser.email },
    );

    expect(foundUser.name).toBe(existingUser.name);
    expect(foundUser.email).toBe(existingUser.email);

    const newUser = await UserWithBigint.firstOrCreate(
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

  test("should firstOrCreate (read) an user", async () => {
    const existingUser = await UserFactory.userWithBigint(1);

    const foundUser = await UserWithBigint.firstOrCreate(
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

  test("should firstOrCreate (create) an user", async () => {
    const foundUser = await UserWithBigint.firstOrCreate(
      { email: "" },
      { ...UserFactory.getCommonUserData() },
    );

    const allUsers = await UserWithBigint.find();
    expect(foundUser).toHaveProperty("id");
    expect(allUsers).toHaveLength(1);
  });

  test("should truncate the table", async () => {
    await UserFactory.userWithBigint(10);
    const allUsers = await UserWithBigint.find();
    expect(allUsers).toHaveLength(10);

    await UserWithBigint.truncate({ force: true });
    const allUsersAfterTruncate = await UserWithBigint.find();
    expect(allUsersAfterTruncate).toHaveLength(0);
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
