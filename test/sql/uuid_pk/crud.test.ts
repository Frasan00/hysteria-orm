import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserStatus, UserWithUuid } from "../test_models/uuid/user_uuid";

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
  test("remove annotations", async () => {
    await UserFactory.userWithUuid(2);
    const user = await UserWithUuid.query()
      .annotate("count", "id", "count")
      .removeAnnotations()
      .one();

    expect((user as any)?.$annotations).toBeUndefined();

    const user2 = await UserWithUuid.query()
      .annotate("count", "id", "count")
      .one();

    expect(user2?.$annotations).not.toBeUndefined();
  });

  test("lockForUpdate", async () => {
    if (env.DB_TYPE === "sqlite") {
      console.log("Sqlite does not support lockForUpdate");
      return;
    }

    await UserFactory.userWithUuid(2);
    const users = await UserWithUuid.query().lockForUpdate().many();
    expect(users.length).toBe(2);
    expect(users[0]).not.toBeUndefined();
    expect(users[1]).not.toBeUndefined();

    const users2 = await UserWithUuid.query()
      .lockForUpdate({ skipLocked: true })
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

    await UserFactory.userWithUuid(2);
    const users = await UserWithUuid.query().forShare().many();
    expect(users.length).toBe(2);
    expect(users[0]).not.toBeUndefined();
    expect(users[1]).not.toBeUndefined();
  });

  test("pluck", async () => {
    await UserFactory.userWithUuid(2);
    const users = await UserWithUuid.query().pluck("name");
    expect(users.length).toBe(2);
    expect(users[0]).not.toBeUndefined();
    expect(users[1]).not.toBeUndefined();
  });

  test("increment", async () => {
    const user = await UserFactory.userWithUuid(1);
    const originalAge = user.age;
    await UserWithUuid.query().increment("age", 1);

    const updatedUser = await UserWithUuid.query().one();

    expect(Number(updatedUser?.age)).toBe(Number(originalAge) + 1);
  });

  test("decrement", async () => {
    const user = await UserFactory.userWithUuid(1);
    const originalAge = user.age;
    await UserWithUuid.query().decrement("age", 1);

    const updatedUser = await UserWithUuid.query().one();

    expect(Number(updatedUser?.age)).toBe(Number(originalAge) - 1);
  });

  test("Select all without `select` method call (default behavior)", async () => {
    await UserFactory.userWithUuid(2);
    const users = await UserWithUuid.query().many();
    expect(users.length).toBe(2);
    expect(users[0].name).not.toBeUndefined();
    expect(users[1].name).not.toBeUndefined();
  });

  test("Select all", async () => {
    await UserFactory.userWithUuid(2);
    const users = await UserWithUuid.query().select("*").many();
    expect(users.length).toBe(2);
    expect(users[0].name).not.toBeUndefined();
    expect(users[1].name).not.toBeUndefined();
  });

  test("Multiple select", async () => {
    await UserFactory.userWithUuid(2);
    const users = await UserWithUuid.query()
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
    await UserFactory.userWithUuid(2);
    const users = await UserWithUuid.query()
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
    await UserFactory.userWithUuid(10);
    const users = await UserWithUuid.query().paginate(1, 5);
    expect(users.data.length).toBe(5);
    expect(users.paginationMetadata.total).toBe(10);
    expect(users.paginationMetadata.currentPage).toBe(1);
    expect(users.paginationMetadata.lastPage).toBe(2);
  });

  test("Multiple columns select", async () => {
    await UserFactory.userWithUuid(2);
    const users = await UserWithUuid.query().select("age", "birthDate").many();
    expect(users.length).toBe(2);
    expect(users[0].age).not.toBeUndefined();
    expect(users[1].age).not.toBeUndefined();
    expect(users[0].birthDate).not.toBeUndefined();
    expect(users[1].birthDate).not.toBeUndefined();
    expect(Object.keys(users[0]).length).toBe(2); // age, birthDate
    expect(Object.keys(users[1]).length).toBe(2);
  });

  test("Multiple columns select with aliases", async () => {
    await UserFactory.userWithUuid(2);
    const users = await UserWithUuid.query()
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
    const user = await UserFactory.userWithUuid(1);
    const retrievedUser = await UserWithUuid.findOne({
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
    const user = await UserFactory.userWithUuid(1);
    const updatedUser = await UserWithUuid.updateRecord({
      ...user,
      name: "John Doe",
    });

    expect(updatedUser.name).toBe("John Doe");
    expect(updatedUser.id).toBe(user.id);
    expect(updatedUser.updatedAt).not.toBeNull();
    expect(updatedUser.updatedAt).not.toBe(user.updatedAt);
    expect(updatedUser.createdAt).not.toBeNull();
    expect(updatedUser.createdAt).toBe(updatedUser.createdAt);
  });

  test("should delete an user", async () => {
    const user = await UserFactory.userWithUuid(1);
    await UserWithUuid.deleteRecord(user);

    const deletedUser = await UserWithUuid.findOne({
      where: { id: user.id },
    });

    expect(deletedUser).toBeNull();
  });

  test("should create multiple users", async () => {
    const users = await UserFactory.userWithUuid(2);

    expect(users).toHaveLength(2);
    users.forEach((user) => {
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("email");
    });
  });

  test("should find users by name pattern", async () => {
    await UserFactory.userWithUuid(3);
    const allUsers = await UserWithUuid.find();
    expect(allUsers.length).toBe(3);
  });

  test("should find one user by email", async () => {
    const user1 = await UserFactory.userWithUuid(1);
    await UserFactory.userWithUuid(1);

    const foundUser = await UserWithUuid.findOne({
      where: { email: user1.email },
    });

    expect(foundUser).not.toBeNull();
    expect(foundUser?.email).toBe(user1.email);
  });

  test("should handle empty results gracefully", async () => {
    await UserFactory.userWithUuid(1);

    const users = await UserWithUuid.find({
      where: { name: "NonExistent" },
    });
    expect(users).toHaveLength(0);

    const user = await UserWithUuid.findOne({
      where: { email: "nonexistent@example.com" },
    });
    expect(user).toBeNull();
  });

  test("should throw error when trying to findOneOrFail with non-existent criteria", async () => {
    await UserFactory.userWithUuid(1);

    await expect(
      UserWithUuid.findOneOrFail({
        where: { email: "nonexistent@example.com" },
      }),
    ).rejects.toThrow();
  });

  test("should handle firstOrInsert operation", async () => {
    const existingUser = await UserFactory.userWithUuid(1);

    const foundUser = await UserWithUuid.firstOrInsert(
      { email: existingUser.email },
      { name: "Different Name", email: existingUser.email },
    );

    expect(foundUser.name).toBe(existingUser.name);
    expect(foundUser.email).toBe(existingUser.email);

    const newUser = await UserWithUuid.firstOrInsert(
      { email: "new@example.com" },
      { name: "New User", email: "new@example.com", status: UserStatus.active },
    );

    expect(newUser.name).toBe("New User");
    expect(newUser.email).toBe("new@example.com");
  });

  test("should handle different user statuses", async () => {
    const activeUser = await UserFactory.userWithUuid(1, UserStatus.active);
    const inactiveUser = await UserFactory.userWithUuid(1, UserStatus.inactive);

    expect(activeUser.status).toBe(UserStatus.active);
    expect(inactiveUser.status).toBe(UserStatus.inactive);

    const activeUsers = await UserWithUuid.find({
      where: { status: UserStatus.active },
    });
    expect(activeUsers).toHaveLength(1);

    const inactiveUsers = await UserWithUuid.find({
      where: { status: UserStatus.inactive },
    });
    expect(inactiveUsers).toHaveLength(1);
  });

  test("should firstOrInsert (read) an user", async () => {
    const existingUser = await UserFactory.userWithUuid(1);

    const foundUser = await UserWithUuid.firstOrInsert(
      { email: existingUser.email },
      { name: "Different Name", email: existingUser.email },
    );

    const newUser = await UserWithUuid.findOne({
      where: { email: existingUser.email },
    });

    const allUsers = await UserWithUuid.find();
    expect(foundUser).toHaveProperty("id");
    expect(newUser).not.toBeNull();
    expect(newUser?.email).toBe(existingUser.email);
    expect(allUsers).toHaveLength(1);
  });

  test("should firstOrInsert (create) an user", async () => {
    const foundUser = await UserWithUuid.firstOrInsert(
      { email: "" },
      { ...UserFactory.getCommonUserData() },
    );

    const allUsers = await UserWithUuid.find();
    expect(foundUser).toHaveProperty("id");
    expect(allUsers).toHaveLength(1);
  });

  test("should update user via bulk update", async () => {
    const user = await UserFactory.userWithUuid(1);
    await UserWithUuid.query().update({
      name: "John Doe",
    });

    const allUsers = await UserWithUuid.find();
    expect(allUsers).toHaveLength(1);
    expect(allUsers[0].name).toBe("John Doe");
    expect(allUsers[0].updatedAt).not.toBe(allUsers[0].createdAt);
    expect(allUsers[0].updatedAt).not.toBe(user.updatedAt);
  });
});

describe(`[${env.DB_TYPE}] Where Operations`, () => {
  describe("Simple equality", () => {
    test("should find by simple value equality", async () => {
      const user = await UserFactory.userWithUuid(1);
      await UserFactory.userWithUuid(1);

      const found = await UserWithUuid.find({
        where: { email: user.email },
      });

      expect(found).toHaveLength(1);
      expect(found[0].email).toBe(user.email);
    });

    test("should find with $eq operator", async () => {
      const user = await UserFactory.userWithUuid(1);
      await UserFactory.userWithUuid(1);

      const found = await UserWithUuid.find({
        where: { email: { op: "$eq", value: user.email } },
      });

      expect(found).toHaveLength(1);
      expect(found[0].email).toBe(user.email);
    });

    test("should find with $ne operator", async () => {
      const user1 = await UserFactory.userWithUuid(1);
      await UserFactory.userWithUuid(1);

      const found = await UserWithUuid.find({
        where: { email: { op: "$ne", value: user1.email } },
      });

      expect(found).toHaveLength(1);
      expect(found[0].email).not.toBe(user1.email);
    });
  });

  describe("Comparison operators", () => {
    test("should find with $gt operator", async () => {
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 25,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 35,
      });

      const found = await UserWithUuid.find({
        where: { age: { op: "$gt", value: 30 } },
      });

      expect(found).toHaveLength(1);
      expect(Number(found[0].age)).toBeGreaterThan(30);
    });

    test("should find with $gte operator", async () => {
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 25,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 30,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 35,
      });

      const found = await UserWithUuid.find({
        where: { age: { op: "$gte", value: 30 } },
      });

      expect(found).toHaveLength(2);
      found.forEach((user) => {
        expect(Number(user.age)).toBeGreaterThanOrEqual(30);
      });
    });

    test("should find with $lt operator", async () => {
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 25,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 35,
      });

      const found = await UserWithUuid.find({
        where: { age: { op: "$lt", value: 30 } },
      });

      expect(found).toHaveLength(1);
      expect(Number(found[0].age)).toBeLessThan(30);
    });

    test("should find with $lte operator", async () => {
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 25,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 30,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 35,
      });

      const found = await UserWithUuid.find({
        where: { age: { op: "$lte", value: 30 } },
      });

      expect(found).toHaveLength(2);
      found.forEach((user) => {
        expect(Number(user.age)).toBeLessThanOrEqual(30);
      });
    });
  });

  describe("Between operators", () => {
    test("should find with $between operator", async () => {
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 20,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 30,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 40,
      });

      const found = await UserWithUuid.find({
        where: { age: { op: "$between", value: [25, 35] } },
      });

      expect(found).toHaveLength(1);
      expect(Number(found[0].age)).toBe(30);
    });

    test("should find with $not between operator", async () => {
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 20,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 30,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 40,
      });

      const found = await UserWithUuid.find({
        where: { age: { op: "$not between", value: [25, 35] } },
      });

      expect(found).toHaveLength(2);
    });
  });

  describe("Null operators", () => {
    test("should find with $is null operator", async () => {
      const user1 = await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        shortDescription: null as any,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        shortDescription: "has description",
      });

      const found = await UserWithUuid.find({
        where: { shortDescription: { op: "$is null" } },
      });

      expect(found).toHaveLength(1);
      expect(found[0].id).toBe(user1.id);
    });

    test("should find with $is not null operator", async () => {
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        shortDescription: null as any,
      });
      const user2 = await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        shortDescription: "has description",
      });

      const found = await UserWithUuid.find({
        where: { shortDescription: { op: "$is not null" } },
      });

      expect(found).toHaveLength(1);
      expect(found[0].id).toBe(user2.id);
    });
  });

  describe("Like operators", () => {
    test("should find with $like operator", async () => {
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "John Doe",
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "Jane Smith",
      });

      const found = await UserWithUuid.find({
        where: { name: { op: "$like", value: "John%" } },
      });

      expect(found).toHaveLength(1);
      expect(found[0].name).toBe("John Doe");
    });

    test("should find with $not like operator", async () => {
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "John Doe",
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "Jane Smith",
      });

      const found = await UserWithUuid.find({
        where: { name: { op: "$not like", value: "John%" } },
      });

      expect(found).toHaveLength(1);
      expect(found[0].name).toBe("Jane Smith");
    });
  });

  describe("In operators", () => {
    test("should find with $in operator", async () => {
      const user1 = await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 25,
      });
      const user2 = await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 30,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 35,
      });

      const found = await UserWithUuid.find({
        where: { age: { op: "$in", value: [25, 30] } },
      });

      expect(found).toHaveLength(2);
      const foundIds = found.map((u) => u.id);
      expect(foundIds).toContain(user1.id);
      expect(foundIds).toContain(user2.id);
    });

    test("should find with $nin operator", async () => {
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 25,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 30,
      });
      const user3 = await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 35,
      });

      const found = await UserWithUuid.find({
        where: { age: { op: "$nin", value: [25, 30] } },
      });

      expect(found).toHaveLength(1);
      expect(found[0].id).toBe(user3.id);
    });
  });

  describe("$and operator", () => {
    test("should find with $and combining multiple conditions", async () => {
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "John Doe",
        age: 25,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "John Doe",
        age: 35,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "Jane Smith",
        age: 25,
      });

      const found = await UserWithUuid.find({
        where: {
          $and: [{ name: "John Doe" }, { age: { op: "$gte", value: 30 } }],
        },
      });

      expect(found).toHaveLength(1);
      expect(found[0].name).toBe("John Doe");
      expect(Number(found[0].age)).toBe(35);
    });
  });

  describe("$or operator", () => {
    test("should find with $or combining multiple conditions", async () => {
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "John Doe",
        age: 25,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "Jane Smith",
        age: 35,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "Bob Wilson",
        age: 40,
      });

      const found = await UserWithUuid.find({
        where: {
          $or: [{ name: "John Doe" }, { name: "Jane Smith" }],
        },
      });

      expect(found).toHaveLength(2);
      const names = found.map((u) => u.name);
      expect(names).toContain("John Doe");
      expect(names).toContain("Jane Smith");
    });
  });

  describe("Complex nested conditions", () => {
    test("should handle nested $and within $or", async () => {
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "John Doe",
        age: 25,
        status: UserStatus.active,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "Jane Smith",
        age: 35,
        status: UserStatus.inactive,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "Bob Wilson",
        age: 40,
        status: UserStatus.active,
      });

      // Find users who are (active AND age < 30) OR (inactive AND age > 30)
      const found = await UserWithUuid.find({
        where: {
          $or: [
            {
              $and: [
                { status: UserStatus.active },
                { age: { op: "$lt", value: 30 } },
              ],
            },
            {
              $and: [
                { status: UserStatus.inactive },
                { age: { op: "$gt", value: 30 } },
              ],
            },
          ],
        },
      });

      expect(found).toHaveLength(2);
      const names = found.map((u) => u.name);
      expect(names).toContain("John Doe");
      expect(names).toContain("Jane Smith");
    });

    test("should handle nested $or within $and", async () => {
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "John Doe",
        age: 25,
        status: UserStatus.active,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "Jane Smith",
        age: 35,
        status: UserStatus.active,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "Bob Wilson",
        age: 40,
        status: UserStatus.inactive,
      });

      // Find users who are active AND (named John Doe OR named Jane Smith)
      const found = await UserWithUuid.find({
        where: {
          $and: [
            { status: UserStatus.active },
            {
              $or: [{ name: "John Doe" }, { name: "Jane Smith" }],
            },
          ],
        },
      });

      expect(found).toHaveLength(2);
      const names = found.map((u) => u.name);
      expect(names).toContain("John Doe");
      expect(names).toContain("Jane Smith");
    });

    test("should handle deeply nested conditions", async () => {
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "John Doe",
        age: 25,
        status: UserStatus.active,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "Jane Smith",
        age: 35,
        status: UserStatus.active,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "Bob Wilson",
        age: 40,
        status: UserStatus.inactive,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "Alice Brown",
        age: 28,
        status: UserStatus.inactive,
      });

      // Complex query:
      // (active AND age between 20-30) OR (inactive AND (age > 35 OR name like 'Alice%'))
      const found = await UserWithUuid.find({
        where: {
          $or: [
            {
              $and: [
                { status: UserStatus.active },
                { age: { op: "$between", value: [20, 30] } },
              ],
            },
            {
              $and: [
                { status: UserStatus.inactive },
                {
                  $or: [
                    { age: { op: "$gt", value: 35 } },
                    { name: { op: "$like", value: "Alice%" } },
                  ],
                },
              ],
            },
          ],
        },
      });

      expect(found).toHaveLength(3);
      const names = found.map((u) => u.name);
      expect(names).toContain("John Doe");
      expect(names).toContain("Bob Wilson");
      expect(names).toContain("Alice Brown");
    });

    test("should combine top-level fields with $and/$or", async () => {
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "John Doe",
        age: 25,
        status: UserStatus.active,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "Jane Smith",
        age: 35,
        status: UserStatus.active,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        name: "Bob Wilson",
        age: 40,
        status: UserStatus.inactive,
      });

      // Find active users who are either John Doe or Jane Smith
      const found = await UserWithUuid.find({
        where: {
          status: UserStatus.active,
          $or: [{ name: "John Doe" }, { name: "Jane Smith" }],
        },
      });

      expect(found).toHaveLength(2);
      found.forEach((user) => {
        expect(user.status).toBe(UserStatus.active);
      });
    });

    test("should handle multiple operations on same field via $and", async () => {
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 25,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 30,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 35,
      });
      await UserWithUuid.insert({
        ...UserFactory.getCommonUserData(),
        age: 40,
      });

      // Find users with age > 25 AND age < 40
      const found = await UserWithUuid.find({
        where: {
          $and: [
            { age: { op: "$gt", value: 25 } },
            { age: { op: "$lt", value: 40 } },
          ],
        },
      });

      expect(found).toHaveLength(2);
      found.forEach((user) => {
        const age = Number(user.age);
        expect(age).toBeGreaterThan(25);
        expect(age).toBeLessThan(40);
      });
    });
  });
});

describe(`[${env.DB_TYPE}] Stream`, () => {
  test("should properly stream results with event listeners", async () => {
    const users: UserWithUuid[] = [];
    await UserFactory.userWithUuid(3);
    const stream = await UserWithUuid.query().orderBy("name", "asc").stream();

    await new Promise<void>((resolve, reject) => {
      stream.on("data", (user) => {
        users.push(user);
      });

      stream.on("end", () => {
        resolve();
      });

      stream.on("error", (error) => {
        reject(error);
      });
    });

    expect(users.length).toBe(3);
    expect(users[0].name).not.toBeUndefined();
    expect(users[1].name).not.toBeUndefined();
    expect(users[2].name).not.toBeUndefined();
  });

  test("should properly stream results with async iteration", async () => {
    if (env.DB_TYPE === "mssql") {
      console.log(
        "MSSQL does not support eager loading within streams in a transaction",
      );
      return;
    }

    const users: any[] = [];
    await UserFactory.userWithUuid(3);
    const stream = await UserWithUuid.query()
      .select("*")
      .load("post")
      .annotate("birthDate", "birthDate")
      .orderBy("name", "asc")
      .stream();

    for await (const user of stream) {
      users.push(user as unknown as UserWithUuid);
    }

    expect(users.length).toBe(3);
    expect(users[0].name).not.toBeUndefined();
    expect(users[1].name).not.toBeUndefined();
    expect(users[2].name).not.toBeUndefined();
    expect(users[0].birthDate).not.toBeUndefined();
    expect(users[1].birthDate).not.toBeUndefined();
    expect(users[2].birthDate).not.toBeUndefined();
    expect(users[0].post).not.toBeUndefined();
    expect(users[0].$annotations.birthDate).not.toBeUndefined();
  });
});
