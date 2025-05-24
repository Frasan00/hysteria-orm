import crypto from "node:crypto";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { env } from "../../../src/env/env";

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

describe(`[${env.DB_TYPE}] Query Builder with uuid`, () => {
  test("should select a post", async () => {
    await SqlDataSource.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
    });

    const retrievedPost = await SqlDataSource.query("posts_with_uuid").one();

    expect(retrievedPost).toBeDefined();
    expect(retrievedPost.id).toBeDefined();
    expect(retrievedPost.title).toBe("Hello World");
  });

  test("should select a post with a custom alias", async () => {
    await SqlDataSource.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
    });

    const retrievedPost = await SqlDataSource.query("posts_with_uuid")
      .annotate("title", "postTitle")
      .one();

    expect(retrievedPost).toBeDefined();
    expect(retrievedPost.postTitle).toBe("Hello World");
  });

  test("should select posts with pagination", async () => {
    await SqlDataSource.query("posts_with_uuid").insertMany([
      { id: crypto.randomUUID(), title: "Hello World" },
      { id: crypto.randomUUID(), title: "Hello World 2" },
    ]);

    const posts = await SqlDataSource.query("posts_with_uuid").paginate(1, 1);

    expect(posts).toBeDefined();
    expect(posts.data.length).toBe(1);
    expect(posts.data[0].id).toBeDefined();
    expect(posts.paginationMetadata.total).toBe(2);
    expect(posts.paginationMetadata.currentPage).toBe(1);
    expect(posts.paginationMetadata.perPage).toBe(1);
    expect(posts.paginationMetadata.hasMorePages).toBe(true);
  });

  test("should get post count", async () => {
    await SqlDataSource.query("posts_with_uuid").insertMany([
      { id: crypto.randomUUID(), title: "Hello World" },
      { id: crypto.randomUUID(), title: "Hello World 2" },
    ]);

    const count = await SqlDataSource.query("posts_with_uuid").getCount();
    expect(count).toBe(2);
  });

  test("should create a post", async () => {
    await SqlDataSource.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
      content: "Hello World Content",
      short_description: "Hello World Short Description",
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

  test("should soft delete a post", async () => {
    await SqlDataSource.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
    });

    await SqlDataSource.query("posts_with_uuid").softDelete({
      column: "deleted_at",
    });

    const retrievedPost = await SqlDataSource.query("posts_with_uuid")
      .whereNull("deleted_at")
      .first();
    expect(retrievedPost).toBeNull();

    const retrievedPostWithDeletedAt = await SqlDataSource.query(
      "posts_with_uuid",
    )
      .whereNotNull("deleted_at")
      .one();

    expect(retrievedPostWithDeletedAt).toBeDefined();
    expect(retrievedPostWithDeletedAt.deleted_at).toBeDefined();
  });

  test("should truncate the table", async () => {
    await SqlDataSource.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
    });

    await SqlDataSource.query("posts_with_uuid").truncate();

    const retrievedPost = await SqlDataSource.query("posts_with_uuid").first();
    expect(retrievedPost).toBeNull();
  });
});

describe(`[${env.DB_TYPE}] Query Builder with a model without a primary key`, () => {
  test("should create a user", async () => {
    await SqlDataSource.query("users_without_pk").insert({
      name: "John Doe",
    });

    const retrievedUser = await SqlDataSource.query("users_without_pk").first();

    expect(retrievedUser).toBeDefined();
    expect(retrievedUser.id).not.toBeDefined();
    expect(retrievedUser.name).toBe("John Doe");
  });

  test("should create multiple users", async () => {
    await SqlDataSource.query("users_without_pk").insertMany([
      { name: "John Doe" },
      { name: "Jane Doe" },
    ]);

    const retrievedUsers = await SqlDataSource.query("users_without_pk")
      .orderBy("name", "desc")
      .many();

    expect(retrievedUsers).toBeDefined();
    expect(retrievedUsers.length).toBe(2);
    expect(retrievedUsers[0].id).not.toBeDefined();
    expect(retrievedUsers[1].id).not.toBeDefined();
    expect(retrievedUsers[0].name).toBe("John Doe");
    expect(retrievedUsers[1].name).toBe("Jane Doe");
  });

  test("should update a user", async () => {
    await SqlDataSource.query("users_without_pk").insert({
      name: "John Doe",
    });

    await SqlDataSource.query("users_without_pk").update({
      name: "Jane Doe",
    });

    const retrievedUser = await SqlDataSource.query("users_without_pk").first();
    expect(retrievedUser.name).toBe("Jane Doe");
  });

  test("should delete a user", async () => {
    await SqlDataSource.query("users_without_pk").insert({
      name: "John Doe",
    });

    await SqlDataSource.query("users_without_pk").delete();

    const retrievedUser = await SqlDataSource.query("users_without_pk").first();
    expect(retrievedUser).toBeNull();
  });

  test("should soft delete a user", async () => {
    await SqlDataSource.query("users_without_pk").insert({
      name: "John Doe",
    });

    await SqlDataSource.query("users_without_pk").softDelete({
      column: "deleted_at",
    });

    const retrievedUser = await SqlDataSource.query("users_without_pk")
      .whereNull("deleted_at")
      .first();
    expect(retrievedUser).toBeNull();

    const retrievedUserWithDeletedAt = await SqlDataSource.query(
      "users_without_pk",
    )
      .whereNotNull("deleted_at")
      .one();

    expect(retrievedUserWithDeletedAt).toBeDefined();
    expect(retrievedUserWithDeletedAt.deleted_at).toBeDefined();
  });

  test("should truncate the table", async () => {
    await SqlDataSource.query("users_without_pk").insert({
      name: "John Doe",
    });

    await SqlDataSource.query("users_without_pk").truncate();

    const retrievedUser = await SqlDataSource.query("users_without_pk").first();
    expect(retrievedUser).toBeNull();
  });
});
