import { DateTime } from "luxon";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { User } from "../../sql_models/User";

let sql: SqlDataSource | null = null;
beforeAll(async () => {
  sql = await SqlDataSource.connect({
    type: "postgres",
    database: "test",
    username: "root",
    password: "root",
    host: "127.0.0.1",
    port: 5432,
    logs: true,
  });
});

afterAll(async () => {
  if (sql) {
    await sql.closeConnection();
  }
});

beforeEach(async () => {
  await User.query().delete();
});

afterEach(async () => {
  await User.query().delete();
});

test("Create a new user", async () => {
  const user = await User.insert({
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

  const foundUser = await User.findOneByPrimaryKey(user.id);
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

  const userWithDynamicColumn = await User.addDynamicColumns(user, [
    "getFirstUser",
  ]);
  expect(userWithDynamicColumn).not.toBeNull();
  expect((userWithDynamicColumn as User).id).not.toBeNull();
  expect((userWithDynamicColumn as any).firstUser.name).not.toBeNull();

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

test("Update a user", async () => {
  await User.insert({
    name: "Eve",
    email: "sdada",
    signupSource: "email",
    isActive: true,
  });

  const user = await User.query().where("name", "Eve").oneOrFail();
  user.name = "Eve Updated";
  const updatedUser = await User.updateRecord(user);

  expect(updatedUser).not.toBeNull();
  expect(updatedUser?.name).toBe("Eve Updated");

  await User.query()
    .where("name", "Eve Updated")
    .update({ name: "Eve updated two" });
  const newUpdatedUser = await User.findOneByPrimaryKey(user.id);
  expect(newUpdatedUser?.name).toBe("Eve updated two");
});

test("Delete a user", async () => {
  await User.insert({
    name: "Eve updated two",
    email: "sdada",
    signupSource: "email",
    isActive: true,
  });

  await User.query().where("name", "Eve updated two").delete();
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
  expect(users[0].name).toBe("Hank");
  expect(users[1].name).toBe("Ivy");
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

  const affectedRows = await User.query()
    .where("name", "Micheal")
    .update({ name: "Micheal Updated" });

  expect(affectedRows).toBe(2);
  const users = await User.query().many();
  expect(users.length).toBe(2);

  const userCount = await User.query().getCount();
  expect(userCount).toBe(2);
});

test("massive delete", async () => {
  await User.insert({
    name: "Dave",
    email: "Dave@gmail.com",
    signupSource: "email",
    isActive: true,
  });

  const affectedRows = await User.query().delete();
  expect(affectedRows).toBe(1);
  expect(await User.query().getCount()).toBe(0);
});

test("massive soft delete", async () => {
  await User.insert({
    name: "Dave",
    email: "Dave@gmail.com",
    signupSource: "email",
    isActive: true,
  });

  const users = await User.query().softDelete();
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

  await User.query().softDelete();

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
    .groupBy(
      "users.id",
      "posts.id",
      "posts.title",
      "posts.content",
      "posts.userId",
    )
    .orderBy("deletedAt", "ASC")
    .limit(10)
    .offset(0)
    .one();
});

test("Regex", async () => {
  await User.insert({
    name: "Dave",
    email: "test",
    signupSource: "email",
    isActive: true,
  });

  const users = await User.query().whereRegexp("name", /Dave/).many();
  expect(users.length).toBe(1);
  expect(users[0].name).toBe("Dave");
});

test("Find one or fail", async () => {
  await User.insert({
    name: "Dave",
    email: "test",
    signupSource: "email",
    isActive: true,
  });

  const user = await User.query().where("name", "Dave").oneOrFail();
  expect(user).not.toBeNull();
  expect(user.name).toBe("Dave");

  try {
    await User.query().where("name", "Dave2").oneOrFail();
  } catch (error) {
    expect(error).not.toBeNull();
  }
});

test("First or fail", async () => {
  await User.insert({
    name: "Dave",
    email: "test",
    signupSource: "email",
    isActive: true,
  });

  const user = await User.query().firstOrFail();
  expect(user).not.toBeNull();
  expect(user.name).toBe("Dave");

  try {
    await User.query().where("name", "Dave2").firstOrFail();
  } catch (error) {
    expect(error).not.toBeNull();
  }
});

test("One or fail", async () => {
  await User.insert({
    name: "Dave",
    email: "test",
    signupSource: "email",
    isActive: true,
  });

  const user = await User.query().oneOrFail();
  expect(user).not.toBeNull();
  expect(user.name).toBe("Dave");

  try {
    await User.query().where("name", "Dave2").oneOrFail();
  } catch (error) {
    expect(error).not.toBeNull();
  }
});

test("Order by", async () => {
  await User.insertMany([
    {
      name: "Dave",
      email: "test",
      signupSource: "email",
      isActive: true,
    },
    {
      name: "Dave2",
      email: "test2",
      signupSource: "email",
      isActive: true,
    },
  ]);

  const users = await User.query().orderBy("name", "ASC").many();
  expect(users.length).toBe(2);
  expect(users[0].name).toBe("Dave");
});

test("Multi order by", async () => {
  await User.insertMany([
    {
      name: "Dave",
      email: "test",
      signupSource: "email",
      isActive: true,
    },
    {
      name: "Dave2",
      email: "test2",
      signupSource: "email",
      isActive: true,
    },
  ]);

  const users = await User.query()
    .orderBy("name", "ASC")
    .orderBy("email", "ASC")
    .many();
  expect(users.length).toBe(2);
  expect(users[0].name).toBe("Dave");
  expect(users[1].name).toBe("Dave2");
});

test("Order by raw", async () => {
  await User.insertMany([
    {
      name: "Dave",
      email: "test",
      signupSource: "email",
      isActive: true,
    },
    {
      name: "Dave2",
      email: "test2",
      signupSource: "email",
      isActive: true,
    },
  ]);

  const users = await User.query().orderByRaw("name DESC").many();
  expect(users.length).toBe(2);
  expect(users[0].name).toBe("Dave2");
});

test("Having raw", async () => {
  await User.insertMany([
    {
      name: "Dave",
      email: "test",
      signupSource: "email",
      isActive: true,
    },
    {
      name: "Dave2",
      email: "test2",
      signupSource: "email",
      isActive: true,
    },
  ]);

  const users = await User.query()
    .select("name")
    .groupBy("name")
    .havingRaw("name = 'Dave'")
    .many();
  expect(users.length).toBe(1);
  expect(users[0].name).toBe("Dave");
});
