import { DateTime } from "luxon";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { User } from "../../User";

let sql: SqlDataSource | null = null;
beforeAll(async () => {
  sql = await SqlDataSource.connect({
    type: "sqlite",
    database: "sqlite.db",
    logs: true,
  });
});

afterAll(async () => {
  if (sql) {
    await sql.closeConnection();
  }
});

beforeEach(async () => {
  await User.deleteQuery().delete();
});

afterEach(async () => {
  await User.deleteQuery().delete();
});

test("Create a new user", async () => {
  const user = await User.insert({
    name: "Alice",
    email: "Alice@gmail.com",
    signupSource: "email",
    isActive: true,
  });

  if (!user || !user.id) {
    throw new Error("User not created");
  }

  const users = await User.insertMany([
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
  const user = await User.insert({
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

test("When condition", async () => {
  await User.insert({
    name: "Dave",
    email: "Dave@gmail.com",
    signupSource: "email",
    isActive: true,
  });

  await User.insert({
    name: "Dave2",
    email: "Dave2@gmail.com",
    signupSource: "email",
    isActive: true,
  });

  const trueValue = 1;
  const notExistingValue = null;
  let user: User | null = null;
  user = await User.query()
    .when(trueValue, (_value, query) => {
      query.orWhere("name", "LIKE", "Dave2");
    })
    .one();

  expect(user).not.toBeNull();
  expect(user?.name).toBe("Dave2");

  user = await User.query()
    .when(notExistingValue, (_value, query) => {
      query.orWhere("name", "LIKE", "Dave2");
    })
    .one();

  expect(user).not.toBeNull();
  expect(user?.name).toBe("Dave");
});

test("Dynamic column", async () => {
  const user = await User.insert({
    name: "Jack",
    email: "Jack@gmail.com",
    signupSource: "email",
    isActive: true,
  });

  if (!user) {
    throw new Error("User not created");
  }

  const dynamicColumnUser = await User.query()
    .addDynamicColumns(["getFirstUser"])
    .one();
  expect(dynamicColumnUser).not.toBe(null);
  expect(dynamicColumnUser?.id).not.toBe(null);
});

test("Find multiple users", async () => {
  const users = await User.find();
  expect(users.length).toBeGreaterThanOrEqual(0);
});

test("Find one user", async () => {
  const user = await User.insert({
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

// TODO: Fix this test with correct migrations for sqlite
// test("Update a user", async () => {
//   await User.insert({
//     name: "Eve",
//     email: "sdada",
//     signupSource: "email",
//     isActive: true,
//   });

//   const user = await User.query().where("name", "Eve").oneOrFail();
//   user.name = "Eve Updated";
//   const updatedUser = await User.updateRecord(user);

//   expect(updatedUser).not.toBeNull();
//   expect(updatedUser?.name).toBe("Eve Updated");

//   await User.update()
//     .where("name", "Eve Updated")
//     .withData({ name: "Eve updated two" });
//   const newUpdatedUser = await User.findOneByPrimaryKey(user.id);
//   expect(newUpdatedUser?.name).toBe("Eve updated two");
// });

test("Delete a user", async () => {
  await User.insert({
    name: "Eve updated two",
    email: "sdada",
    signupSource: "email",
    isActive: true,
  });

  await User.deleteQuery().where("name", "Eve updated two").delete();
  const updatedUser = await User.query().where("name", "Eve updated two").one();
  expect(updatedUser).toBeNull();
});

test("Soft delete a user", async () => {
  const user = await User.insert({
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
  const users = await User.insertMany([
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
});

test("Refresh a user", async () => {
  const user = await User.insert({
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

test("Remove all users from the database", async () => {
  const allUsers = await User.query().many();
  expect(allUsers.length).toBe(0);
});

test("Nested query builder", async () => {
  const user = await User.insert({
    name: "Linda",
    email: "ssdada",
    signupSource: "email",
    isActive: true,
  });

  if (!user) {
    throw new Error("User not created");
  }

  await User.query()
    .whereBuilder((builder) => {
      builder.where("name", "Linda");
    })
    .orWhereBuilder((builder) => {
      builder.where("email", "ssdada");
    })
    .andWhere("createdAt", ">", DateTime.local().minus({ days: 1 }).toString())
    .andWhereBuilder((builder) => {
      builder.where("isActive", true);
    })
    .one();

  await User.query()
    .whereBuilder((builder) => {
      builder.where("name", "Linda");
    })
    .orWhereBetween(
      "createdAt",
      DateTime.local().minus({ days: 1 }).toString(),
      DateTime.local().toString(),
    )
    .andWhereBuilder((builder) => {
      builder.where("isActive", true);
    })
    .many();
});

test("Multiple update", async () => {
  await User.insert({
    name: "Micheal",
    email: "test",
    signupSource: "email",
    isActive: true,
  });

  await User.insert({
    name: "Micheal",
    email: "test2",
    signupSource: "email",
    isActive: true,
  });

  const models = await User.update()
    .where("name", "Micheal")
    .withData({ name: "Micheal Updated" });

  expect(models).toBe(2);
  const users = await User.query().many();
  expect(users.length).toBe(2);
});

test("massive delete", async () => {
  await User.insert({
    name: "Dave",
    email: "Dave@gmail.com",
    signupSource: "email",
    isActive: true,
  });

  const users = await User.deleteQuery().delete();
  expect(users).toBe(1);
  expect(await User.query().getCount()).toBe(0);
});

test("massive soft delete", async () => {
  await User.insert({
    name: "Dave",
    email: "Dave@gmail.com",
    signupSource: "email",
    isActive: true,
  });

  const users = await User.deleteQuery().softDelete();
  expect(users).toBe(1);
  expect(await User.query().getCount({ ignoreHooks: true })).toBe(1);
});

test("Pagination", async () => {
  await User.insert({
    name: "Dave",
    email: "sdsa",
    signupSource: "email",
    isActive: true,
  });

  const users = await User.query().paginate(1, 10);
  expect(users.paginationMetadata).not.toBeNull();

  expect(users.data.length).toBe(1);
});

test("Ignore hooks", async () => {
  await User.insert({
    name: "Dave",
    email: "sdsa",
    signupSource: "email",
    isActive: true,
  });

  await User.deleteQuery().softDelete();

  const user = await User.query().one({ ignoreHooks: ["beforeFetch"] });
  expect(user).not.toBeNull();

  const userFindOne = await User.findOne({
    where: { name: "Dave" },
    ignoreHooks: ["beforeFetch"],
  });
  expect(userFindOne).not.toBeNull();

  const userFind = await User.find({ ignoreHooks: ["beforeFetch"] });
  expect(userFind).not.toBeNull();

  const userOne = await User.query().one({ ignoreHooks: ["beforeFetch"] });
  expect(userOne).not.toBeNull();
});

test("Very complex query", async () => {
  await User.query()
    .whereBuilder((builder) => {
      builder.where("name", "Dave");
      builder.where("email", "sdasd");
      builder.orWhereBetween("createdAt", "2021-01-01", "2021-01-02");
    })
    .orWhereBuilder((builder) => {
      builder.where("email", "sadasd");
      builder.where("isActive", true);
    })
    .andWhereBuilder((builder) => {
      builder.where("isActive", true);
    })
    .orWhere("signupSource", "email")
    .addRelations(["posts"])
    .andWhereIn("name", ["Dave", "John", "Alice"])
    .addDynamicColumns(["getFirstUser"])
    .where("name", "LIKE", "Dave")
    .orWhere("email", "LIKE", "Dave")
    .andWhere("is_active", true)
    .orWhere("signup_source", "email")
    .where("name", "LIKE", "Dave")
    .orWhere("email", "LIKE", "Dave")
    .andWhere("isActive", true)
    .orWhere("signupSource", "email")
    .where("name", "LIKE", "Dave")
    .join("posts", "users.id", "posts.user_id")
    .groupBy("users.id", "posts.id")
    .orderBy(["deletedAt"], "ASC")
    .limit(10)
    .offset(0)
    .one();
});