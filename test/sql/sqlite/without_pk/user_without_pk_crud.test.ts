import { SqlDataSource } from "../../../../src/sql/sql_data_source";
import { UserFactory } from "../../test_models/factory/user_factory";
import { UserWithoutPk } from "../../test_models/without_pk/user_without_pk";

beforeAll(async () => {
  await SqlDataSource.connect({
    type: "mariadb",
    port: 3307,
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
  await UserWithoutPk.query().delete();
});

test("should create an user", async () => {
  await UserFactory.userWithoutPk(1);
  const allUsers = await UserWithoutPk.all();
  expect(allUsers).toHaveLength(1);
});

test("should create multiple users", async () => {
  await UserFactory.userWithoutPk(2);
  const userCount = await UserWithoutPk.query().getCount();
  expect(userCount).toBe(2);
});

test("should find users by name pattern", async () => {
  await UserFactory.userWithoutPk(3);
  const allUsers = await UserWithoutPk.find();
  expect(allUsers.length).toBe(3);
});

test("should find one user by email", async () => {
  await UserFactory.userWithoutPk(1);
  const foundUser = await UserWithoutPk.findOne({});
  expect(foundUser).not.toBeNull();
});

test("should truncate the table", async () => {
  await UserFactory.userWithoutPk(10);
  const allUsers = await UserWithoutPk.find();
  expect(allUsers).toHaveLength(10);

  await UserWithoutPk.truncate();
  const allUsersAfterTruncate = await UserWithoutPk.find();
  expect(allUsersAfterTruncate).toHaveLength(0);
});
