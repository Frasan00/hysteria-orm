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
  await Post.delete().execute();
  await User.delete().execute();
});

afterEach(async () => {
  await Post.delete().execute();
  await User.delete().execute();
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

  await Post.delete().execute();
  await User.delete().execute();
  const allPosts = await Post.query().many();
  expect(allPosts.length).toBe(0);
  const allUsers = await User.query().many();
  expect(allUsers.length).toBe(0);
});
