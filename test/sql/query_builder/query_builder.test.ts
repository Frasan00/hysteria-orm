import crypto from "node:crypto";
import { SqlDataSource } from "../../../src/sql/sql_data_source";

beforeAll(async () => {
  await SqlDataSource.connect();
});

afterAll(async () => {
  await SqlDataSource.disconnect();
});

beforeEach(async () => {
  await SqlDataSource.startGlobalTransaction();
});

afterEach(async () => {
  await SqlDataSource.rollbackGlobalTransaction();
});

test("should create a post", async () => {
  await SqlDataSource.query("posts_with_uuid").insert({
    id: crypto.randomUUID(),
    title: "Hello World",
    content: "Hello World Content",
    shortDescription: "Hello World Short Description",
  });

  const retrievedPost = await SqlDataSource.query("posts_with_uuid").one();

  expect(retrievedPost).toBeDefined();
  expect(retrievedPost.id).toBeDefined();
  expect(retrievedPost.title).toBe("Hello World");
});

test("should create multiple posts", async () => {
  await SqlDataSource.query("posts_with_uuid").insertMany([
    { id: crypto.randomUUID(), title: "Hello World" },
    { id: crypto.randomUUID(), title: "Hello World 2" },
  ]);

  const posts = await SqlDataSource.query("posts_with_uuid")
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
  await SqlDataSource.query("posts_with_uuid").insert({
    id: crypto.randomUUID(),
    title: "Hello World",
  });

  await SqlDataSource.query("posts_with_uuid").update({
    title: "Hello World Updated",
  });

  const retrievedPost = await SqlDataSource.query("posts_with_uuid").first();
  expect(retrievedPost.title).toBe("Hello World Updated");
});

test("should delete a post", async () => {
  await SqlDataSource.query("posts_with_uuid").insert({
    id: crypto.randomUUID(),
    title: "Hello World",
  });

  await SqlDataSource.query("posts_with_uuid").delete();

  const retrievedPost = await SqlDataSource.query("posts_with_uuid").first();
  expect(retrievedPost).toBeNull();
});
