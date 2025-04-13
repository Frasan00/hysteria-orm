import { SqlDataSource } from "../../../../src/sql/sql_data_source";
import { UserFactory } from "../../test_models/factory/user_factory";
import { UserStatus } from "../../test_models/without_pk/user_without_pk";
import { UserWithBigint } from "../../test_models/bigint/user_bigint";

beforeAll(async () => {
  await SqlDataSource.connect({
    type: "postgres",
    host: "localhost",
    username: "root",
    password: "root",
    database: "test",
    logs: true,
  });
});

afterAll(async () => {
  await SqlDataSource.disconnect();
});

afterEach(async () => {
  await UserWithBigint.query().delete();
});

test("should create an user", async () => {
  const user = await UserFactory.userWithBigint(1);
  expect(user).toHaveProperty("id");
  expect(typeof user.id).toBe("number");
  expect(user).not.toHaveProperty("password");
  expect(user).toHaveProperty("name");
  expect(user).toHaveProperty("email");
});

test("should update an user", async () => {
  const user = await UserFactory.userWithBigint(1);
  user.name = "John Doe";
  const updatedUser = await UserWithBigint.updateRecord(user);

  expect(updatedUser.name).toBe("John Doe");
});

test("should not delete an user", async () => {
  const user = await UserFactory.userWithBigint(1);
  await UserWithBigint.deleteRecord(user);
  const allUsers = await UserWithBigint.find();
  expect(allUsers).toHaveLength(0);
});

test("should create multiple users", async () => {
  const users = await UserFactory.userWithBigint(2);

  expect(users).toHaveLength(2);
  users.forEach((user) => {
    expect(user).toHaveProperty("id");
    expect(typeof user.id).toBe("number");
    expect(user).toHaveProperty("name");
    expect(user).toHaveProperty("email");
  });
});

test("should find users", async () => {
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
  console.log("sjfnaosknf", foundUser);

  expect(foundUser.name).toBe(existingUser.name);
  expect(foundUser.email).toBe(existingUser.email);

  const newUser = await UserWithBigint.firstOrCreate(
    { email: "new@example.com" },
    { name: "New User", email: "new@example.com", status: UserStatus.active },
  );

  expect(newUser.name).toBe("New User");
  expect(newUser.email).toBe("new@example.com");
});

test("should handle firstOrCreate operation full response", async () => {
  const existingUser = await UserFactory.userWithBigint(1);

  const foundUser = await UserWithBigint.firstOrCreate(
    { email: existingUser.email },
    { name: "Different Name", email: existingUser.email },
    { fullResponse: true },
  );

  expect(foundUser.isNew).toBe(false);
  expect(foundUser.model.name).toBe(existingUser.name);
  expect(foundUser.model.email).toBe(existingUser.email);

  const newUser = await UserWithBigint.firstOrCreate(
    { email: "new@example.com" },
    { name: "New User", email: "new@example.com", status: UserStatus.active },
  );

  expect(newUser.name).toBe("New User");
  expect(newUser.email).toBe("new@example.com");
});

test("should handle upsert operation when user already exists", async () => {
  const existingUser = await UserFactory.userWithBigint(1);
  const updatedUser = await UserWithBigint.upsert(
    { email: existingUser.email },
    { ...UserFactory.getCommonUserData(), name: "Different Name" },
  );

  expect(updatedUser.name).toBe("Different Name");
});

test("should handle upsert operation when user does not exist", async () => {
  const newUser = await UserWithBigint.upsert(
    { email: "new@example.com" },
    { ...UserFactory.getCommonUserData(), name: "New User" },
  );

  expect(newUser.name).toBe("New User");
  expect(newUser.email).not.toBe("new@example.com");
});

test("should handle upsertMany operation when users already exist", async () => {
  await UserFactory.userWithBigint(2, UserStatus.active);
  const updatedUsers = await UserWithBigint.upsertMany(
    ["status"],
    [
      { ...UserFactory.getCommonUserData(), status: UserStatus.inactive },
      { ...UserFactory.getCommonUserData(), status: UserStatus.inactive },
    ],
  );

  expect(updatedUsers).toHaveLength(2);
  expect(updatedUsers[0].status).toBe(UserStatus.inactive);
  expect(updatedUsers[1].status).toBe(UserStatus.inactive);
});

test("should handle upsertMany operation when users do not exist", async () => {
  const updatedUsers = await UserWithBigint.upsertMany(
    ["email"],
    [
      {
        ...UserFactory.getCommonUserData(),
        name: "New User",
        email: "new@example.com",
      },
      {
        ...UserFactory.getCommonUserData(),
        name: "New User",
        email: "new2@example.com",
      },
    ],
  );

  expect(updatedUsers).toHaveLength(2);
  expect(updatedUsers[0].name).toBe("New User");
  expect(updatedUsers[0].email).toBe("new@example.com");
  expect(updatedUsers[1].name).toBe("New User");
  expect(updatedUsers[1].email).toBe("new2@example.com");
});

test("should handle different user statuses", async () => {
  const activeUser = await UserFactory.userWithBigint(1, UserStatus.active);
  const inactiveUser = await UserFactory.userWithBigint(1, UserStatus.inactive);

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

  await UserWithBigint.firstOrCreate(
    { email: existingUser.email },
    { name: "Different Name", email: existingUser.email },
  );

  const newUser = await UserWithBigint.findOne({
    where: { email: existingUser.email },
  });

  const allUsers = await UserWithBigint.find();
  expect(newUser).not.toBeNull();
  expect(newUser?.email).toBe(existingUser.email);
  expect(allUsers).toHaveLength(1);
});

test("should firstOrCreate (create) an user", async () => {
  await UserWithBigint.firstOrCreate(
    { email: "" },
    { ...UserFactory.getCommonUserData() },
  );

  const allUsers = await UserWithBigint.find();
  expect(allUsers).toHaveLength(1);
});

test("should not truncate the table", async () => {
  await UserFactory.userWithBigint(10);
  const allUsers = await UserWithBigint.find();
  expect(allUsers).toHaveLength(10);
  expect(async () => await UserWithBigint.truncate()).rejects.toThrow();
});

test("should truncate the table with force", async () => {
  await UserFactory.userWithBigint(10);
  const allUsers = await UserWithBigint.find();
  expect(allUsers).toHaveLength(10);

  await UserWithBigint.truncate(true);
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
