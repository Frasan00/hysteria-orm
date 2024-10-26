import { User } from "../../sql_models/User";
import { Post } from "../../sql_models/Post";
import { Address } from "../../sql_models/Address";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { ModelQueryBuilder } from "../../sql/query_builder/query_builder";

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
  await sql?.rawQuery("TRUNCATE TABLE user_addresses CASCADE");
  await Post.query().delete();
  await User.query().delete();
  await Address.query().delete();
});

afterEach(async () => {
  await sql?.rawQuery("TRUNCATE TABLE user_addresses CASCADE");
  await Post.query().delete();
  await User.query().delete();
  await Address.query().delete();
});

test("Create a new user with posts", async () => {
  const user = await User.insert({
    name: "Alice",
    email: "alice-test@gmail.com",
    signupSource: "email",
    isActive: true,
  });

  if (!user) {
    throw new Error("User not created");
  }

  const post = await Post.insert({
    userId: user.id,
    title: "Post 1",
    content: "Content 1",
  });

  if (!post) {
    throw new Error("Post not created");
  }

  const userWithPosts = await User.query()
    .where("id", user.id)
    .with("posts")
    .one();
  expect(userWithPosts).not.toBeNull();
  expect(userWithPosts?.posts).not.toBeNull();
  expect(userWithPosts?.posts.length).toBe(1);
  expect(userWithPosts?.posts[0].title).toBe("Post 1");

  const userWithPost = await User.query()
    .where("id", user.id)
    .with("post")
    .one();
  expect(userWithPost).not.toBeNull();
  expect(userWithPost?.post).not.toBeNull();
  expect(userWithPost?.post.title).toBe("Post 1");

  const postWithUser = await Post.query()
    .where("id", post.id)
    .with("user")
    .one();
  expect(postWithUser).not.toBeNull();
  expect(postWithUser?.user).not.toBeNull();
  expect(postWithUser?.user.name).toBe("Alice");
  expect(postWithUser?.user.email).toBe("alice-test@gmail.com");
});

test("Join users and posts", async () => {
  const user = await User.insert({
    name: "Bob",
    email: "bob-test@gmail.com",
    signupSource: "email",
    isActive: true,
  });

  if (!user) {
    throw new Error("User not created");
  }

  const post1 = await Post.insert({
    userId: user.id,
    title: "Post 1",
    content: "Content 1",
  });

  if (!post1) {
    throw new Error("Posts not created");
  }

  const joinedUsersAndPosts = await User.query()
    .select("posts.*", "users.email AS superUserEmail")
    .join("posts", "users.id", "posts.userId")
    .where("users.id", user.id)
    .groupBy(
      "posts.id",
      "users.id",
      "posts.title",
      "posts.content",
      "posts.userId",
    )
    .many();

  expect(joinedUsersAndPosts).not.toBeNull();
  expect(joinedUsersAndPosts.length).toBe(1);
  expect(joinedUsersAndPosts[0].$additionalColumns.title).toBe("Post 1");
  expect(joinedUsersAndPosts[0].$additionalColumns.superUserEmail).toBe(
    "bob-test@gmail.com",
  );

  const leftJoinedUsersAndPosts = await User.query()
    .select("*")
    .leftJoin("posts", "users.id", "posts.userId")
    .where("users.id", user.id)
    .many();

  expect(leftJoinedUsersAndPosts).not.toBeNull();
  expect(leftJoinedUsersAndPosts.length).toBe(1);
  expect(leftJoinedUsersAndPosts[0].$additionalColumns.title).toBe("Post 1");
});

test("Raw join users and posts", async () => {
  const user = await User.insert({
    name: "Bob",
    email: "test",
    signupSource: "test",
    isActive: true,
  });

  if (!user) {
    throw new Error("User not created");
  }

  const post1 = await Post.insert({
    userId: user.id,
    title: "Post 1",
    content: "Content 1",
  });

  if (!post1) {
    throw new Error("Posts not created");
  }

  const joinedUsersAndPosts = await User.query()
    .select("posts.*", "users.email AS superUserEmail")
    .joinRaw("JOIN posts ON users.id = posts.user_id")
    .many();

  expect(joinedUsersAndPosts).not.toBeNull();
  expect(joinedUsersAndPosts.length).toBe(1);
  expect(joinedUsersAndPosts[0].$additionalColumns.title).toBe("Post 1");
  expect(joinedUsersAndPosts[0].$additionalColumns.superUserEmail).toBe("test");
});

test("posts with users", async () => {
  const user = await User.insert({
    name: "Bob",
    email: "test",
    signupSource: "test",
    isActive: true,
  });

  if (!user) {
    throw new Error("User not created");
  }

  const post1 = await Post.insert({
    userId: user.id,
    title: "Post 1",
    content: "Content 1",
  });

  const post2 = await Post.insert({
    userId: user.id,
    title: "Post 2",
    content: "Content 2",
  });

  const usersWithPosts = await User.query().with("posts").many();

  expect(usersWithPosts).not.toBeNull();
  expect(usersWithPosts.length).toBe(1);
  expect(usersWithPosts[0].posts).not.toBeNull();
  expect(usersWithPosts[0].posts.length).toBe(2);
  expect(usersWithPosts[0].posts[0].title).toBe("Post 1");
  expect(usersWithPosts[0].posts[1].title).toBe("Post 2");

  const postsWithUser = await Post.query().with("user").many();

  expect(postsWithUser).not.toBeNull();
  expect(postsWithUser.length).toBe(2);
  expect(postsWithUser[0].user).not.toBeNull();
  expect(postsWithUser[0].user.name).toBe("Bob");
  expect(postsWithUser[0].user.email).toBe("test");
  expect(postsWithUser[1].user).not.toBeNull();
  expect(postsWithUser[1].user.name).toBe("Bob");
  expect(postsWithUser[1].user.email).toBe("test");
});

test("Create a new user with addresses", async () => {
  const user = await User.insert({
    name: "Alice",
    email: "test",
    signupSource: "test",
    isActive: true,
  });

  if (!user) {
    throw new Error("User not created");
  }

  const address1 = await Address.insert({
    street: "Street 1",
    city: "City 1",
    state: "State 1",
  });

  if (!address1) {
    throw new Error("Address not created");
  }

  const address2 = await Address.insert({
    street: "Street 2",
    city: "City 2",
    state: "State 2",
  });

  if (!address2) {
    throw new Error("Address not created");
  }

  await sql?.rawQuery(
    "INSERT INTO user_addresses (user_id, address_id) VALUES ($1, $2), ($3, $4)",
    [user.id, address1.id, user.id, address2.id],
  );

  const users = await User.query().with("addresses").many();
  expect(users).not.toBeNull();
  expect(users.length).toBe(1);
  expect(users[0].addresses).not.toBeNull();
  expect(users[0].addresses.length).toBe(2);
  expect(users[0].addresses[0].street).toBe("Street 1");
  expect(users[0].addresses[1].street).toBe("Street 2");
});

test(" test with 5 users and addresses in many to many relation", async () => {
  const users = await User.insertMany([
    {
      name: "Alice",
      email: "test",
      signupSource: "test",
      isActive: true,
    },
    {
      name: "Bob",
      email: "test",
      signupSource: "test",
      isActive: true,
    },
    {
      name: "Charlie",
      email: "test",
      signupSource: "test",
      isActive: true,
    },
    {
      name: "David",
      email: "test",
      signupSource: "test",
      isActive: true,
    },
    {
      name: "Eve",
      email: "test",
      signupSource: "test",
      isActive: true,
    },
  ]);

  if (!users.length) {
    throw new Error("Users not created");
  }

  const addresses = await Address.insertMany([
    {
      street: "Street 1",
      city: "City 1",
      state: "State 1",
    },
    {
      street: "Street 2",
      city: "City 2",
      state: "State 2",
    },
    {
      street: "Street 3",
      city: "City 3",
      state: "State 3",
    },
    {
      street: "Street 4",
      city: "City 4",
      state: "State 4",
    },
    {
      street: "Street 5",
      city: "City 5",
      state: "State 5",
    },
  ]);

  if (!addresses.length) {
    throw new Error("Addresses not created");
  }

  await sql?.rawQuery(
    "INSERT INTO user_addresses (user_id, address_id) VALUES ($1, $2), ($3, $4), ($5, $6), ($7, $8), ($9, $10)",
    [
      users[0].id,
      addresses[0].id,
      users[1].id,
      addresses[1].id,
      users[2].id,
      addresses[2].id,
      users[3].id,
      addresses[3].id,
      users[4].id,
      addresses[4].id,
    ],
  );

  const usersWithAddresses = await User.query().with("addresses").many();

  expect(usersWithAddresses).not.toBeNull();
  expect(usersWithAddresses.length).toBe(5);
  expect(usersWithAddresses[0].addresses).not.toBeNull();
  expect(usersWithAddresses[0].addresses.length).toBe(1);
  expect(usersWithAddresses[0].addresses[0].street).toBe("Street 1");
  expect(usersWithAddresses[1].addresses).not.toBeNull();
  expect(usersWithAddresses[1].addresses.length).toBe(1);
  expect(usersWithAddresses[1].addresses[0].street).toBe("Street 2");
  expect(usersWithAddresses[2].addresses).not.toBeNull();
  expect(usersWithAddresses[2].addresses.length).toBe(1);
  expect(usersWithAddresses[2].addresses[0].street).toBe("Street 3");
  expect(usersWithAddresses[3].addresses).not.toBeNull();
  expect(usersWithAddresses[3].addresses.length).toBe(1);
  expect(usersWithAddresses[3].addresses[0].street).toBe("Street 4");
  expect(usersWithAddresses[4].addresses).not.toBeNull();
  expect(usersWithAddresses[4].addresses.length).toBe(1);
  expect(usersWithAddresses[4].addresses[0].street).toBe("Street 5");

  const addressesWithUsers = await Address.query().with("users").many();

  expect(addressesWithUsers).not.toBeNull();
  expect(addressesWithUsers.length).toBe(5);
  expect(addressesWithUsers[0].users).not.toBeNull();
  expect(addressesWithUsers[0].users.length).toBe(1);
  expect(addressesWithUsers[0].users[0].name).toBe("Alice");
  expect(addressesWithUsers[1].users).not.toBeNull();
  expect(addressesWithUsers[1].users.length).toBe(1);
  expect(addressesWithUsers[1].users[0].name).toBe("Bob");
  expect(addressesWithUsers[2].users).not.toBeNull();
  expect(addressesWithUsers[2].users.length).toBe(1);
  expect(addressesWithUsers[2].users[0].name).toBe("Charlie");
  expect(addressesWithUsers[3].users).not.toBeNull();
  expect(addressesWithUsers[3].users.length).toBe(1);
  expect(addressesWithUsers[3].users[0].name).toBe("David");
  expect(addressesWithUsers[4].users).not.toBeNull();
  expect(addressesWithUsers[4].users.length).toBe(1);
  expect(addressesWithUsers[4].users[0].name).toBe("Eve");
});

test(" test with relation query builder", async () => {
  const users = await User.insertMany([
    {
      name: "Alice",
      email: "test",
      signupSource: "test",
      isActive: true,
    },
  ]);

  if (!users.length) {
    throw new Error("Users not created");
  }

  const addresses = await Address.insertMany([
    {
      street: "Street 1",
      city: "City 1",
      state: "State 1",
    },
    {
      street: "Street 2",
      city: "City 2",
      state: "State 2",
    },
    {
      street: "Street 3",
      city: "City 3",
      state: "State 3",
    },
    {
      street: "Street 4",
      city: "City 4",
      state: "State 4",
    },
    {
      street: "Street 5",
      city: "City 5",
      state: "State 5",
    },
  ]);

  if (!addresses.length) {
    throw new Error("Addresses not created");
  }

  await sql?.rawQuery(
    "INSERT INTO user_addresses (user_id, address_id) VALUES ($1, $2), ($3, $4), ($5, $6), ($7, $8), ($9, $10)",
    [
      users[0].id,
      addresses[0].id,
      users[0].id,
      addresses[1].id,
      users[0].id,
      addresses[2].id,
      users[0].id,
      addresses[3].id,
      users[0].id,
      addresses[4].id,
    ],
  );

  const usersWithAddresses = await User.query()
    .with("addresses", Address, (query: ModelQueryBuilder<Address>) => {
      query
        .select(
          "addresses.id",
          "city",
          "street",
          "user_addresses.user_id as user_address_user_id",
          "city as SUPER_CITY",
          "SUM(1) as count",
          "MAX(1) as max",
          "addresses.id as test_id",
          "SUM(addresses.id) as sumTest",
        )
        .where("city", "City 1")
        .addDynamicColumns(["getTest"]);
    })
    .many();

  expect(usersWithAddresses).not.toBeNull();
  expect(usersWithAddresses.length).toBe(1);
  expect(usersWithAddresses[0].addresses).not.toBeNull();
  expect(usersWithAddresses[0].addresses.length).toBe(1);
  expect(usersWithAddresses[0].addresses[0].street).toBe("Street 1");
  expect(usersWithAddresses[0].addresses[0].city).toBe("City 1");
  expect(usersWithAddresses[0].addresses[0].state).toBeUndefined();
});
