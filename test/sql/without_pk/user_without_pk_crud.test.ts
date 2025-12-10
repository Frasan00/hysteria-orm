import { env } from "../../../src/env/env";
import { HysteriaError } from "../../../src/errors/hysteria_error";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserFactory } from "../test_models/factory/user_factory";
import {
  UserStatus,
  UserWithoutPk,
} from "../test_models/without_pk/user_without_pk";

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
  test("Annotate", async () => {
    await UserFactory.userWithoutPk(2);
    const user = await UserWithoutPk.query()
      .annotate("max", "age", "maxAge")
      .first();

    expect(user).not.toBeUndefined();
    expect(user?.$annotations.maxAge).toBeDefined();
  });

  test("Select before annotate", async () => {
    await UserFactory.userWithoutPk(2);
    const user = await UserWithoutPk.query()
      .select("name")
      .annotate("age", "superAge")
      .first();

    expect(user).not.toBeUndefined();
    expect(user?.name).toBeDefined();
    expect(user?.$annotations.superAge).toBeDefined();
  });

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

  test("Multiple select", async () => {
    await UserFactory.userWithoutPk(2);
    const users = await UserWithoutPk.query()
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
    await UserFactory.userWithoutPk(2);
    const users = await UserWithoutPk.query()
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
      .annotate("age", "result")
      .annotate("birthDate", "result2")
      .many();

    expect(users.length).toBe(2);
    expect(users[0].$annotations.result).not.toBeUndefined();
    expect(users[1].$annotations.result2).not.toBeUndefined();
    expect(users[0].$annotations.result).not.toBeUndefined();
    expect(users[1].$annotations.result2).not.toBeUndefined();
    expect(Object.keys(users[0]).length).toBe(1); // $annotations
    expect(Object.keys(users[1]).length).toBe(1);
  });

  test("Custom From alias", async () => {
    await UserFactory.userWithoutPk(2);
    const users = await UserWithoutPk.query()
      .select("u1.name")
      .from("users_without_pk as u1")
      .where("u1.name", "!=", "impossible_name")
      .many({ ignoreHooks: ["beforeFetch"] });

    expect(users).toHaveLength(2);
  });

  test("Union", async () => {
    await UserFactory.userWithoutPk(2);
    const users = await UserWithoutPk.query()
      .select("name")
      .union((qb) => qb.select("name")) // without duplicates
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
      .unionAll((qb) => qb.select("name"))
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

    const userMaxAge = await UserWithoutPk.query()
      .select("age")
      .orderBy("age", "asc")
      .groupBy("age")
      .getMax("age");
    expect(userMaxAge).toBeGreaterThan(0);
    expect(userMaxAge).toBeLessThan(1000);

    const userAgeMin = await UserWithoutPk.query()
      .select("age")
      .orderBy("age", "asc")
      .groupBy("age")
      .getMin("age");
    expect(userAgeMin).toBeGreaterThan(0);
    expect(userAgeMin).toBeLessThan(1000);

    const userAgeAvg = await UserWithoutPk.query()
      .select("age")
      .orderBy("age", "asc")
      .groupBy("age")
      .getAvg("age");
    expect(userAgeAvg).toBeGreaterThan(0);
    expect(userAgeAvg).toBeLessThan(1000);

    const userAgeSum = await UserWithoutPk.query()
      .select("age")
      .orderBy("age", "asc")
      .groupBy("age")
      .getSum("age");
    expect(userAgeSum).toBeGreaterThan(0);
    expect(userAgeSum).toBeLessThan(1000);
  });

  test("Normal CTE", async () => {
    await UserFactory.userWithoutPk(2);
    const users = await UserWithoutPk.query()
      .with("users_cte", (qb) => qb.select("name"))
      .with("users_cte2", (qb) => qb.select("age"))
      .many();

    expect(users.length).toBe(2);
  });

  test("CTE with recursive", async () => {
    if (env.DB_TYPE === "mssql") {
      return;
    }

    await UserFactory.userWithoutPk(2);
    const users = await UserWithoutPk.query()
      .withRecursive("users_cte", (qb) => qb.select("name"))
      .withRecursive("users_cte2", (qb) => qb.select("age"))
      .many();

    expect(users.length).toBe(2);
  });

  test("CTE with materialized", async () => {
    if (env.DB_TYPE !== "postgres") {
      return;
    }

    await UserFactory.userWithoutPk(2);
    const users = await UserWithoutPk.query()
      .withMaterialized("users_cte", (qb) => qb.select("name"))
      .withMaterialized("users_cte2", (qb) => qb.select("age"))
      .many();

    expect(users.length).toBe(2);
  });

  test("One for each cte", async () => {
    if (env.DB_TYPE !== "postgres") {
      return;
    }

    await UserFactory.userWithoutPk(2);
    const users = await UserWithoutPk.query()
      .with("users_cte", (qb) => qb.select("name"))
      .withRecursive("users_cte2", (qb) => qb.select("age"))
      .withMaterialized("users_cte3", (qb) => qb.select("age"))
      .many();

    expect(users.length).toBe(2);
  });

  test("CTE with UNION", async () => {
    await UserFactory.userWithoutPk(2);
    const users = await UserWithoutPk.query()
      .with("users_cte", (qb) => qb.select("salary"))
      .with("users_cte2", (qb) => qb.select("age"))
      .select("users_cte.salary")
      .from("users_cte")
      .unionAll((qb) => qb.select("users_cte2.age").from("users_cte2"))
      .many({ ignoreHooks: ["beforeFetch"] });

    expect(users.length).toBe(4);
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
    expect(user).toHaveProperty("description");
    expect(user).toHaveProperty("shortDescription");
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

  test("should handle firstOrInsert operation", async () => {
    const existingUser = await UserFactory.userWithoutPk(1);
    const foundUser = await UserWithoutPk.firstOrInsert(
      { email: existingUser.email },
      { name: "Different Name", email: existingUser.email },
    );

    expect(foundUser.name).toBe(existingUser.name);
    expect(foundUser.email).toBe(existingUser.email);

    const newUser = await UserWithoutPk.firstOrInsert(
      { email: "new@example.com" },
      {
        ...UserFactory.getCommonUserData(),
        name: "New User",
        email: "new@example.com",
      },
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

  test("should firstOrInsert (read) an user", async () => {
    const existingUser = await UserFactory.userWithoutPk(1);

    const foundUser = await UserWithoutPk.firstOrInsert(
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

  test("should firstOrInsert (create) an user", async () => {
    const foundUser = await UserWithoutPk.firstOrInsert(
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

    await UserWithoutPk.truncate();
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

describe(`[${env.DB_TYPE}] Query Builder Paginate With Cursor`, () => {
  test("should paginate with cursor", async () => {
    await UserWithoutPk.insertMany([
      { name: "User 1", age: 21, email: "cursor1@test.com" },
      { name: "User 2", age: 22, email: "cursor2@test.com" },
      { name: "User 3", age: 23, email: "cursor3@test.com" },
      { name: "User 4", age: 24, email: "cursor4@test.com" },
      { name: "User 5", age: 25, email: "cursor5@test.com" },
      { name: "User 6", age: 26, email: "cursor6@test.com" },
      { name: "User 7", age: 27, email: "cursor7@test.com" },
      { name: "User 8", age: 28, email: "cursor8@test.com" },
      { name: "User 9", age: 29, email: "cursor9@test.com" },
      { name: "User 10", age: 30, email: "cursor10@test.com" },
    ]);

    const [users, cursor] = await UserWithoutPk.query().paginateWithCursor(5, {
      discriminator: "age",
    });
    expect(users.data.length).toBe(5);
    expect(users.paginationMetadata.total).toBe(10);

    const [users2] = await UserWithoutPk.query().paginateWithCursor(
      5,
      { discriminator: "age" },
      cursor,
    );
    expect(users2.data.length).toBe(5);
    expect(users2.paginationMetadata.total).toBe(10);
  });
});
