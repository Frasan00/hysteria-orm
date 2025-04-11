import { SqlDataSource } from "../../../src/sql/sql_data_source";
import crypto from "node:crypto";

let sql: SqlDataSource;

beforeAll(async () => {
  sql = await SqlDataSource.connect({
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
  await SqlDataSource.query("posts_with_uuid").delete();
});

test("should create a post", async () => {
  const post = await sql.query("posts_with_uuid").insert({
    id: crypto.randomUUID(),
    title: "Hello World",
  });

  expect(post).toBeDefined();
  expect(post.id).toBeDefined();
  expect(post.title).toBe("Hello World");
});

test("should create multiple posts", async () => {
  await sql.query("posts_with_uuid").insertMany([
    { id: crypto.randomUUID(), title: "Hello World" },
    { id: crypto.randomUUID(), title: "Hello World 2" },
  ]);

  const posts = await sql
    .query("posts_with_uuid")
    .orderBy("title", "asc")
    .many();
  expect(posts).toBeDefined();
  expect(posts.length).toBe(2);
  expect(posts[0].id).toBeDefined();
  expect(posts[1].id).toBeDefined();
  expect(posts[0].title).toBe("Hello World");
  expect(posts[1].title).toBe("Hello World 2");
});

test("should update a post", async () => {
  const post = await sql.query("posts_with_uuid").insert({
    id: crypto.randomUUID(),
    title: "Hello World",
  });

  const updatedPost = await sql
    .query("posts_with_uuid")
    .where("id", post.id)
    .update({
      title: "Hello World Updated",
    });

  expect(updatedPost).toBeDefined();
  const retrievedPost = await sql
    .query("posts_with_uuid")
    .where("id", post.id)
    .first();
  expect(retrievedPost.title).toBe("Hello World Updated");
});

test("should delete a post", async () => {
  const post = await sql.query("posts_with_uuid").insert({
    id: crypto.randomUUID(),
    title: "Hello World",
  });

  const deletedPost = await sql
    .query("posts_with_uuid")
    .where("id", post.id)
    .delete();
  expect(deletedPost).toBeDefined();
  expect(deletedPost).toBe(1);

  const retrievedPost = await sql
    .query("posts_with_uuid")
    .where("id", post.id)
    .first();
  expect(retrievedPost).toBeNull();
});
