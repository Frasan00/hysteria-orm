import { SqlDataSource } from "../../../../src";
import { HysteriaError } from "../../../../src/errors/hysteria_error";
import { UserFactory } from "../../test_models/factory/user_factory";
import {
  UserStatus,
  UserWithoutPk,
} from "../../test_models/without_pk/user_without_pk";

beforeAll(async () => {
  await SqlDataSource.connect({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "root",
    password: "root",
    database: "test",
  });
});

afterAll(async () => {
  await SqlDataSource.disconnect();
});

afterEach(async () => {
  await UserWithoutPk.query().delete();
});

test("should create an user", async () => {
  const user = await UserFactory.userWithoutPk(1);
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
  const inactiveUser = await UserFactory.userWithoutPk(1, UserStatus.inactive);

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
