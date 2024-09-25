import { User } from "../Models/User";
import { Post } from "../Models/Post";
import { SqlDataSource } from "../../../src/Sql/SqlDatasource";

let sql: SqlDataSource | null = null;
beforeAll(async () => {
  sql = await SqlDataSource.connect({
    type: "postgres",
    database: "test",
    username: "root",
    password: "root",
    host: "127.0.0.1",
    port: 5432,
  });
});

afterAll(async () => {
  if (sql) {
    await sql.closeConnection();
  }
});

beforeEach(async () => {
  await Post.deleteQuery().delete();
  await User.deleteQuery().delete();
});

afterEach(async () => {
  await Post.deleteQuery().delete();
  await User.deleteQuery().delete();
});

test("Create a new user with posts", async () => {
  const user = await User.create({
    name: "Alice",
    email: "alice-test@gmail.com",
    signupSource: "email",
    isActive: true,
  });

  if (!user) {
    throw new Error("User not created");
  }

  const post = await Post.create({
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
  const user = await User.create({
    name: "Bob",
    email: "bob-test@gmail.com",
    signupSource: "email",
    isActive: true,
  });

  if (!user) {
    throw new Error("User not created");
  }

  const post1 = await Post.create({
    userId: user.id,
    title: "Post 1",
    content: "Content 1",
  });

  const post2 = await Post.create({
    userId: user.id,
    title: "Post 2",
    content: "Content 2",
  });

  if (!post1 || !post2) {
    throw new Error("Posts not created");
  }

  const joinedUsersAndPosts = await User.query()
    .select("*")
    .join("posts", "users.id", "posts.userId")
    .where("users.id", user.id)
    .many();

  expect(joinedUsersAndPosts).not.toBeNull();
  expect(joinedUsersAndPosts.length).toBe(2);
  expect(joinedUsersAndPosts[0].extraColumns.title).toBe("Post 1");

  const leftJoinedUsersAndPosts = await User.query()
    .select("*")
    .leftJoin("posts", "users.id", "posts.userId")
    .where("users.id", user.id)
    .many();

  expect(leftJoinedUsersAndPosts).not.toBeNull();
  expect(leftJoinedUsersAndPosts.length).toBe(2);
  expect(leftJoinedUsersAndPosts[0].extraColumns.title).toBe("Post 1");
});
