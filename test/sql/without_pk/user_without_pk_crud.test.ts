import { HysteriaError } from "../../../src/errors/hysteria_error";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { env } from "../../../src/env/env";
import { UserStatus } from "../test_models/bigint/user_bigint";
import { UserFactory } from "../test_models/factory/user_factory";
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

describe(`[${env.DB_TYPE}] Select`, () => {
  test("Select all without `select` method call (default behavior)", async () => {
    await UserFactory.userWithoutPk(2);
    const users = await UserWithoutPk.query().many();
    expect(users.length).toBe(2);
    expect(users[0].name).not.toBeUndefined();
    expect(users[1].name).not.toBeUndefined();
  });

  test("Select all", async () => {
    await UserFactory.userWithoutPk(2);
    const users = await UserWithoutPk.query().select("*").many();
    expect(users.length).toBe(2);
    expect(users[0].name).not.toBeUndefined();
    expect(users[1].name).not.toBeUndefined();
  });

  test("Pagination", async () => {
    await UserFactory.userWithoutPk(10);
    const users = await UserWithoutPk.query().paginate(1, 5);
    expect(users.data.length).toBe(5);
    expect(users.paginationMetadata.total).toBe(10);
    expect(users.paginationMetadata.currentPage).toBe(1);
    expect(users.paginationMetadata.lastPage).toBe(2);
  });

  test("Multiple columns select", async () => {
    await UserFactory.userWithoutPk(2);
    const users = await UserWithoutPk.query().select("age", "birthDate").many();
    expect(users.length).toBe(2);
    expect(users[0].age).not.toBeUndefined();
    expect(users[1].age).not.toBeUndefined();
    expect(users[0].birthDate).not.toBeUndefined();
    expect(users[1].birthDate).not.toBeUndefined();
    expect(Object.keys(users[0]).length).toBe(2); // age, birthDate
    expect(Object.keys(users[1]).length).toBe(2);
  });

  test("Multiple columns select with aliases", async () => {
    await UserFactory.userWithoutPk(2);
    const users = await UserWithoutPk.query()
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

  test("Union", async () => {
    await UserFactory.userWithoutPk(2);
    const users = await UserWithoutPk.query()
      .select("name")
      .union(UserWithoutPk.query().select("name")) // without duplicates
      .many();

    expect(users.length).toBe(2);

    const users2 = await UserWithoutPk.query()
      .select("name")
      .union((queryBuilder) => queryBuilder.select("name")) // without duplicates
      .many();

    expect(users2.length).toBe(2);
  });

  test("Union All", async () => {
    await UserFactory.userWithoutPk(2);
    const users = await UserWithoutPk.query()
      .select("name")
      .unionAll(UserWithoutPk.query().select("name"))
      .many();

    expect(users.length).toBe(4); // with duplicates

    const users2 = await UserWithoutPk.query()
      .select("name")
      .unionAll((queryBuilder) => queryBuilder.select("name")) // without duplicates
      .many();

    expect(users2.length).toBe(4); // with duplicates
  });

  test("SQL functions built in in Models methods", async () => {
    await UserFactory.userWithoutPk(10);
    await UserWithoutPk.insert({
      ...UserFactory.getCommonUserData(),
      deletedAt: new Date(Date.now()),
    });

    const userCount = await UserWithoutPk.query().getCount("*");
    const userCount2 = await UserWithoutPk.query().getCount("name");
    expect(userCount).toBe(10);
    expect(userCount2).toBe(10);

    const userCountIgnoringHooks = await UserWithoutPk.query().getCount("*", {
      ignoreHooks: true,
    });
    const userCountIgnoringHooks2 = await UserWithoutPk.query().getCount(
      "name",
      { ignoreHooks: true },
    );

    expect(userCountIgnoringHooks).toBe(11);
    expect(userCountIgnoringHooks2).toBe(11);

    const userMaxAge = await UserWithoutPk.query().getMax("age");
    expect(userMaxAge).toBeGreaterThan(0);
    expect(userMaxAge).toBeLessThan(1000);

    const userAgeMin = await UserWithoutPk.query().getMin("age");
    expect(userAgeMin).toBeGreaterThan(0);
    expect(userAgeMin).toBeLessThan(1000);

    const userAgeAvg = await UserWithoutPk.query().getAvg("age");
    expect(userAgeAvg).toBeGreaterThan(0);
    expect(userAgeAvg).toBeLessThan(1000);

    const userAgeSum = await UserWithoutPk.query().getSum("age");
    expect(userAgeSum).toBeGreaterThan(0);
    expect(userAgeSum).toBeLessThan(1000);
  });
});

describe(`[${env.DB_TYPE}] Basic Cruds`, () => {
  test("should create an user", async () => {
    const user = await UserFactory.userWithoutPk(1);
    const retrievedUser = await UserWithoutPk.findOne({
      where: {
        email: user.email,
      },
    });

    expect(retrievedUser).not.toBeNull();
    expect(user).not.toHaveProperty("id");
    expect(user).toHaveProperty("name");
    expect(user).toHaveProperty("email");
  });

  test("should not update an user", async () => {
    const user = await UserFactory.userWithoutPk(1);
    try {
      await UserWithoutPk.updateRecord({
        ...user,
        name: "John Doe",
      });
    } catch (error: any) {
      expect(error).toBeInstanceOf(HysteriaError);
      expect(error.code).toBe("MODEL_HAS_NO_PRIMARY_KEY");
    }
  });

  test("should not delete an user", async () => {
    const user = await UserFactory.userWithoutPk(1);
    try {
      await UserWithoutPk.deleteRecord(user);
    } catch (error: any) {
      expect(error).toBeInstanceOf(HysteriaError);
      expect(error.code).toBe("MODEL_HAS_NO_PRIMARY_KEY");
    }
  });

  test("should create multiple users", async () => {
    const users = await UserFactory.userWithoutPk(2);

    expect(users).toHaveLength(2);
    users.forEach((user) => {
      expect(user).not.toHaveProperty("id");
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("email");
    });
  });

  test("should find users by name pattern", async () => {
    await UserFactory.userWithoutPk(3);
    const allUsers = await UserWithoutPk.find();
    expect(allUsers.length).toBe(3);
  });

  test("should find one user by email", async () => {
    const user1 = await UserFactory.userWithoutPk(1);
    await UserFactory.userWithoutPk(1);

    const foundUser = await UserWithoutPk.findOne({
      where: { email: user1.email },
    });

    expect(foundUser).not.toBeNull();
    expect(foundUser?.email).toBe(user1.email);
  });

  test("should handle empty results gracefully", async () => {
    await UserFactory.userWithoutPk(1);

    const users = await UserWithoutPk.find({
      where: { name: "NonExistent" },
    });
    expect(users).toHaveLength(0);

    const user = await UserWithoutPk.findOne({
      where: { email: "nonexistent@example.com" },
    });
    expect(user).toBeNull();
  });

  test("should throw error when trying to findOneOrFail with non-existent criteria", async () => {
    await UserFactory.userWithoutPk(1);

    await expect(
      UserWithoutPk.findOneOrFail({
        where: { email: "nonexistent@example.com" },
      }),
    ).rejects.toThrow();
  });

  test("should handle firstOrCreate operation", async () => {
    const existingUser = await UserFactory.userWithoutPk(1);

    const foundUser = await UserWithoutPk.firstOrCreate(
      { email: existingUser.email },
      { name: "Different Name", email: existingUser.email },
    );

    expect(foundUser.name).toBe(existingUser.name);
    expect(foundUser.email).toBe(existingUser.email);

    const newUser = await UserWithoutPk.firstOrCreate(
      { email: "new@example.com" },
      { name: "New User", email: "new@example.com", status: UserStatus.active },
    );

    expect(newUser.name).toBe("New User");
    expect(newUser.email).toBe("new@example.com");
  });

  test("should handle different user statuses", async () => {
    const activeUser = await UserFactory.userWithoutPk(1, UserStatus.active);
    const inactiveUser = await UserFactory.userWithoutPk(
      1,
      UserStatus.inactive,
    );

    expect(activeUser.status).toBe(UserStatus.active);
    expect(inactiveUser.status).toBe(UserStatus.inactive);

    const activeUsers = await UserWithoutPk.find({
      where: { status: UserStatus.active },
    });
    expect(activeUsers).toHaveLength(1);

    const inactiveUsers = await UserWithoutPk.find({
      where: { status: UserStatus.inactive },
    });
    expect(inactiveUsers).toHaveLength(1);
  });

  test("should firstOrCreate (read) an user", async () => {
    const existingUser = await UserFactory.userWithoutPk(1);

    const foundUser = await UserWithoutPk.firstOrCreate(
      { email: existingUser.email },
      { name: "Different Name", email: existingUser.email },
    );

    const newUser = await UserWithoutPk.findOne({
      where: { email: existingUser.email },
    });

    const allUsers = await UserWithoutPk.find();
    expect(foundUser).not.toHaveProperty("id");
    expect(newUser).not.toBeNull();
    expect(newUser?.email).toBe(existingUser.email);
    expect(allUsers).toHaveLength(1);
  });

  test("should firstOrCreate (create) an user", async () => {
    const foundUser = await UserWithoutPk.firstOrCreate(
      { email: "" },
      { ...UserFactory.getCommonUserData() },
    );

    const allUsers = await UserWithoutPk.find();
    expect(foundUser).not.toHaveProperty("id");
    expect(allUsers).toHaveLength(1);
  });

  test("should truncate the table", async () => {
    await UserFactory.userWithoutPk(10);
    const allUsers = await UserWithoutPk.find();
    expect(allUsers).toHaveLength(10);

    await UserWithoutPk.truncate({ force: true });
    const allUsersAfterTruncate = await UserWithoutPk.find();
    expect(allUsersAfterTruncate).toHaveLength(0);
  });

  test("should update user via bulk update", async () => {
    const user = await UserFactory.userWithoutPk(1);
    await UserWithoutPk.query().update({
      name: "John Doe",
    });

    const allUsers = await UserWithoutPk.find();
    expect(allUsers).toHaveLength(1);
    expect(allUsers[0].name).toBe("John Doe");
    expect(allUsers[0].updatedAt).not.toBe(allUsers[0].createdAt);
    expect(allUsers[0].updatedAt).not.toBe(user.updatedAt);
  });
});
