import { User } from "../../User";
import { Post } from "../../Post";
import { SqlDataSource } from "../../../src/sql/sql_data_source";

let sql: SqlDataSource | null = null;
beforeAll(async () => {
  sql = await SqlDataSource.connect({
    type: "mysql",
    database: "test",
    username: "root",
    password: "root",
    host: "127.0.0.1",
    port: 3306,
    logs: true,
  });
});

afterAll(async () => {
  if (sql) {
    await sql.closeConnection();
  }
});

beforeEach(async () => {
  await Post.query().delete();
  await User.query().delete();
});

afterEach(async () => {
  await Post.query().delete();
  await User.query().delete();
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
    .addRelations(["posts"])
    .one();
  expect(userWithPosts).not.toBeNull();
  expect(userWithPosts?.posts).not.toBeNull();
  expect(userWithPosts?.posts.length).toBe(1);
  expect(userWithPosts?.posts[0].title).toBe("Post 1");

  const userWithPost = await User.query()
    .where("id", user.id)
    .addRelations(["post"])
    .one();
  expect(userWithPost).not.toBeNull();
  expect(userWithPost?.post).not.toBeNull();
  expect(userWithPost?.post.title).toBe("Post 1");

  const postWithUser = await Post.query()
    .where("id", post.id)
    .addRelations(["user"])
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
    .select("*")
    .join("posts", "id", "userId")
    .where("users.id", user.id)
    .many();

  expect(joinedUsersAndPosts).not.toBeNull();
  expect(joinedUsersAndPosts.length).toBe(1);
  expect(joinedUsersAndPosts[0].$additionalColumns.title).toBe("Post 1");

  const leftJoinedUsersAndPosts = await User.query()
    .select("*")
    .leftJoin("posts", "id", "userId")
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
