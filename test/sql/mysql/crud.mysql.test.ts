import { DateTime } from "luxon";
import { SqlDataSource } from "../../../src/Sql/SqlDatasource";
import { User } from "../Models/User";

let sql: SqlDataSource | null = null;
beforeAll(async () => {
  sql = await SqlDataSource.connect({
    type: "mysql",
    database: "test",
    username: "root",
    password: "root",
    host: "127.0.0.1",
    port: 3306,
  });
});

afterAll(async () => {
  if (sql) {
    await sql.closeConnection();
  }
});

beforeEach(async () => {
  await User.delete().execute();
});

afterEach(async () => {
  await User.delete().execute();
});

test("Create a new user", async () => {
  const user = await User.create({
    name: "Alice",
    email: "Alice@gmail.com",
    signupSource: "email",
    isActive: true,
  });

  if (!user) {
    throw new Error("User not created");
  }

  expect(user.name).toBe("Alice");
  expect(user.email).toBe("Alice@gmail.com");
  expect(user.signupSource).toBe("email");
  expect(user.isActive).toBe(true);

  const users = await User.massiveCreate([
    {
      name: "Bob",
      email: "Bob@gmail.com",
      signupSource: "email",
      isActive: true,
    },
    {
      name: "Charlie",
      email: "Charlie@gmail.com",
      signupSource: "email",
      isActive: true,
    },
  ]);

  expect(users.length).toBe(2);
});

test("Find a user by primary key", async () => {
  const user = await User.create({
    name: "Dave",
    email: "Dave@gmail.com",
    signupSource: "email",
    isActive: true,
  });

  if (!user) {
    throw new Error("User not created");
  }

  const foundUser = await User.findOneByPrimaryKey(user.id, {
    throwErrorOnNull: true,
  });
  expect(foundUser).not.toBeNull();
  expect(foundUser?.name).toBe("Dave");
});

test("Find multiple users", async () => {
  const users = await User.find();
  expect(users.length).toBeGreaterThanOrEqual(0);
});

test("Find one user", async () => {
  const user = await User.create({
    name: "Eve",
    email: "Eve@gmail.com",
    signupSource: "email",
    isActive: true,
  });

  if (!user) {
    throw new Error("User not created");
  }

  const foundUser = await User.findOne({ where: { email: "Eve@gmail.com" } });
  expect(foundUser).not.toBeNull();
  expect(foundUser?.name).toBe("Eve");
});

test("Update a user", async () => {
  await User.create({
    name: "Eve",
    email: "sdada",
    signupSource: "email",
    isActive: true,
  });

  const user = (await User.query()
    .where("name", "Eve")
    .one({ throwErrorOnNull: true })) as User;
  user.name = "Eve Updated";
  const updatedUser = await User.updateRecord(user);

  expect(updatedUser).not.toBeNull();
  expect(updatedUser?.name).toBe("Eve Updated");

  await User.update()
    .where("name", "Eve Updated")
    .withData({ name: "Eve updated two" });
  const newUpdatedUser = await User.findOneByPrimaryKey(user.id);
  expect(newUpdatedUser?.name).toBe("Eve updated two");
});

test("Delete a user", async () => {
  await User.create({
    name: "Eve updated two",
    email: "sdada",
    signupSource: "email",
    isActive: true,
  });

  await User.delete().where("name", "Eve updated two").execute();
  const updatedUser = await User.query().where("name", "Eve updated two").one();
  expect(updatedUser).toBeNull();
});

test("Soft delete a user", async () => {
  const user = await User.create({
    name: "Grace",
    email: "Grace@gmail.com",
    signupSource: "email",
    isActive: true,
  });

  if (!user) {
    throw new Error("User not created");
  }

  const softDeletedUser = await User.softDelete(user, {
    column: "deletedAt",
    value: DateTime.local().toString(),
  });
  expect(softDeletedUser).not.toBeNull();
  expect(softDeletedUser.deletedAt).not.toBeNull();

  const allUsers = await User.query().many();
  expect(allUsers.length).toBe(0);
});

test("Massive create users", async () => {
  const users = await User.massiveCreate([
    {
      name: "Hank",
      email: "Hank@gmail.com",
      signupSource: "email",
      isActive: true,
    },
    {
      name: "Ivy",
      email: "Ivy@gmail.com",
      signupSource: "email",
      isActive: true,
    },
  ]);

  expect(users.length).toBe(2);
  expect(users[0].name).toBe("Hank");
  expect(users[1].name).toBe("Ivy");
});

test("Refresh a user", async () => {
  const user = await User.create({
    name: "Jack",
    email: "Jack@gmail.com",
    signupSource: "email",
    isActive: true,
  });

  if (!user) {
    throw new Error("User not created");
  }

  const refreshedUser = await User.refresh(user);
  expect(refreshedUser).not.toBeNull();
  expect(refreshedUser?.name).toBe("Jack");
});

test("Delete user by column", async () => {
  const user = await User.create({
    name: "Kate",
    email: "Kate@gmail.com",
    signupSource: "email",
    isActive: true,
  });

  if (!user) {
    throw new Error("User not created");
  }

  const deletedCount = await User.deleteByColumn("email", "Kate@gmail.com");
  expect(deletedCount).toBe(1);

  const foundUser = await User.findOneByPrimaryKey(user.id);
  expect(foundUser).toBeNull();
});

test("Remove all users from the database", async () => {
  const allUsers = await User.query().many();
  expect(allUsers.length).toBe(0);
});
