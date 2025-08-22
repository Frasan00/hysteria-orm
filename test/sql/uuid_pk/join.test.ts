import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { PostFactory } from "../test_models/factory/post_factory";
import { UserFactory } from "../test_models/factory/user_factory";
import { PostWithUuid } from "../test_models/uuid/post_uuid";
import { UserWithUuid } from "../test_models/uuid/user_uuid";

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

describe(`[${env.DB_TYPE}] uuid pk join`, () => {
  test("uuid pk simple join", async () => {
    const users = await UserFactory.userWithUuid(3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const postsWithUsers = await PostWithUuid.query()
      .select("posts_with_uuid.*")
      .annotate("users_with_uuid.name", "userName")
      .leftJoin(
        "users_with_uuid",
        "users_with_uuid.id",
        "posts_with_uuid.user_id",
      )
      .whereIn(
        "posts_with_uuid.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(3);
    expect(postsWithUsers[0].$annotations.userName).toBeDefined();
    expect(postsWithUsers[1].$annotations.userName).toBeDefined();
    expect(postsWithUsers[2].$annotations.userName).toBeDefined();

    const columns = PostWithUuid.getColumns();
    expect(Object.keys(postsWithUsers[0]).length - 1).toEqual(columns.length); // ignore additional
  });

  test("uuid pk simple left join", async () => {
    const users = await UserFactory.userWithUuid(3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const postsWithUsers = await PostWithUuid.query()
      .select("posts_with_uuid.*")
      .annotate("users_with_uuid.name", "userName")
      .leftJoin(
        "users_with_uuid",
        "users_with_uuid.id",
        "posts_with_uuid.user_id",
      )
      .whereIn(
        "posts_with_uuid.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(3);
    expect(postsWithUsers[0].$annotations.userName).toBeDefined();
  });

  test("uuid pk simple right join", async () => {
    const users = await UserFactory.userWithUuid(3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const postsWithUsers = await PostWithUuid.query()
      .select("posts_with_uuid.*")
      .annotate("users_with_uuid.name", "userName")
      .rightJoin(
        "users_with_uuid",
        "users_with_uuid.id",
        "posts_with_uuid.user_id",
      )
      .whereIn(
        "posts_with_uuid.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(3);
    expect(postsWithUsers[0].$annotations.userName).toBeDefined();
  });

  test("uuid pk simple Model join", async () => {
    const users = await UserFactory.userWithUuid(3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const postsWithUsers = await PostWithUuid.query()
      .select("posts_with_uuid.*")
      .annotate("users_with_uuid.name", "userName")
      .join(UserWithUuid, "id", "userId")
      .whereIn(
        "posts_with_uuid.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(3);
    expect(postsWithUsers[0].$annotations.userName).toBeDefined();
  });

  test("uuid pk simple Model left join", async () => {
    const users = await UserFactory.userWithUuid(3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const postsWithUsers = await PostWithUuid.query()
      .select("posts_with_uuid.*")
      .annotate("users_with_uuid.name", "userName")
      .leftJoin(UserWithUuid, "id", "userId")
      .whereIn(
        "posts_with_uuid.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(3);
    expect(postsWithUsers[0].$annotations.userName).toBeDefined();
  });

  test("uuid pk join with a custom operator", async () => {
    const users = await UserFactory.userWithUuid(3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const postsWithUsers = PostWithUuid.query()
      .select("posts_with_uuid.*")
      .annotate("users_with_uuid.name", "userName")
      .join(UserWithUuid, "id", "userId", ">")
      .whereIn(
        "posts_with_uuid.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_uuid.id", "asc");

    expect(postsWithUsers.many()).resolves.toBeDefined();
  });

  test("uuid pk simple raw join", async () => {
    const users = await UserFactory.userWithUuid(3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const postsWithUsers = await PostWithUuid.query()
      .select("posts_with_uuid.*")
      .annotate("users_with_uuid.name", "userName")
      .joinRaw(
        "users_with_uuid ON users_with_uuid.id = posts_with_uuid.user_id",
      )
      .whereIn(
        "posts_with_uuid.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(3);
    expect(postsWithUsers[0].$annotations.userName).toBeDefined();
    expect(postsWithUsers[1].$annotations.userName).toBeDefined();
    expect(postsWithUsers[2].$annotations.userName).toBeDefined();
  });

  test("uuid pk simple raw left join", async () => {
    const users = await UserFactory.userWithUuid(3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const postsWithUsers = await PostWithUuid.query()
      .select("posts_with_uuid.*")
      .annotate("users_with_uuid.name", "userName")
      .leftJoinRaw(
        "users_with_uuid ON users_with_uuid.id = posts_with_uuid.user_id",
      )
      .whereIn(
        "posts_with_uuid.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(3);
    expect(postsWithUsers[0].$annotations.userName).toBeDefined();
    expect(postsWithUsers[1].$annotations.userName).toBeDefined();
    expect(postsWithUsers[2].$annotations.userName).toBeDefined();
  });

  test("uuid pk simple raw right join", async () => {
    const users = await UserFactory.userWithUuid(3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const postsWithUsers = await PostWithUuid.query()
      .select("posts_with_uuid.*")
      .annotate("users_with_uuid.name", "userName")
      .rightJoinRaw(
        "users_with_uuid ON users_with_uuid.id = posts_with_uuid.user_id",
      )
      .whereIn(
        "posts_with_uuid.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(3);
    expect(postsWithUsers[0].$annotations.userName).toBeDefined();
    expect(postsWithUsers[1].$annotations.userName).toBeDefined();
    expect(postsWithUsers[2].$annotations.userName).toBeDefined();
  });
});
