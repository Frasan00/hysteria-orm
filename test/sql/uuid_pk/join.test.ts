import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { PostFactory } from "../test_models/factory/post_factory";
import { UserFactory } from "../test_models/factory/user_factory";
import { PostWithUuid } from "../test_models/uuid/post_uuid";
import { UserWithUuid } from "../test_models/uuid/user_uuid";

beforeAll(async () => {
  const dataSource = new SqlDataSource();
  await dataSource.connect();
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
      .select(["users_with_uuid.name", "userName"])
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
    expect(postsWithUsers[0].userName).toBeDefined();
    expect(postsWithUsers[1].userName).toBeDefined();
    expect(postsWithUsers[2].userName).toBeDefined();

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
      .select(["users_with_uuid.name", "userName"])
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
    expect(postsWithUsers[0].userName).toBeDefined();
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
      .select(["users_with_uuid.name", "userName"])
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
    expect(postsWithUsers[0].userName).toBeDefined();
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
      .select(["users_with_uuid.name", "userName"])
      .join(UserWithUuid, "id", "userId")
      .whereIn(
        "posts_with_uuid.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(3);
    expect(postsWithUsers[0].userName).toBeDefined();
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
      .select(["users_with_uuid.name", "userName"])
      .leftJoin(UserWithUuid, "id", "userId")
      .whereIn(
        "posts_with_uuid.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(3);
    expect(postsWithUsers[0].userName).toBeDefined();
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

    const postsWithUsers = await PostWithUuid.query()
      .select("posts_with_uuid.*")
      .select(["users_with_uuid.name", "userName"])
      .join(UserWithUuid, "id", "userId", ">")
      .whereIn(
        "posts_with_uuid.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    expect(postsWithUsers).toBeDefined();
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
      .select(["users_with_uuid.name", "userName"])
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
    expect(postsWithUsers[0].userName).toBeDefined();
    expect(postsWithUsers[1].userName).toBeDefined();
    expect(postsWithUsers[2].userName).toBeDefined();
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
      .select(["users_with_uuid.name", "userName"])
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
    expect(postsWithUsers[0].userName).toBeDefined();
    expect(postsWithUsers[1].userName).toBeDefined();
    expect(postsWithUsers[2].userName).toBeDefined();
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
      .select(["users_with_uuid.name", "userName"])
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
    expect(postsWithUsers[0].userName).toBeDefined();
    expect(postsWithUsers[1].userName).toBeDefined();
    expect(postsWithUsers[2].userName).toBeDefined();
  });

  test("uuid pk join with callback additional conditions", async () => {
    const users = await UserFactory.userWithUuid(3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    // Get the user we want to filter by
    const targetUser = users[0];

    // Use INNER JOIN to filter results based on join condition
    const postsWithUsers = await PostWithUuid.query()
      .select("posts_with_uuid.*")
      .select(["users_with_uuid.name", "userName"])
      .join(
        "users_with_uuid",
        "users_with_uuid.id",
        "posts_with_uuid.user_id",
        (q) => q.where("users_with_uuid.id", targetUser.id),
      )
      .whereIn(
        "posts_with_uuid.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    // Should only get posts for the target user due to INNER JOIN condition
    expect(postsWithUsers).toHaveLength(1);
    expect(postsWithUsers[0].userName).toBeDefined();
    expect(postsWithUsers[0].userName).toBe(targetUser.name);
  });

  test("uuid pk join with callback multiple conditions", async () => {
    const users = await UserFactory.userWithUuid(3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    // Get the users we want to filter by
    const targetUser1 = users[0];
    const targetUser2 = users[1];

    // Use INNER JOIN to filter results based on join condition
    const postsWithUsers = await PostWithUuid.query()
      .select("posts_with_uuid.*")
      .select(["users_with_uuid.name", "userName"])
      .join(
        "users_with_uuid",
        "users_with_uuid.id",
        "posts_with_uuid.user_id",
        (q) =>
          q.whereIn("users_with_uuid.id", [targetUser1.id, targetUser2.id]),
      )
      .whereIn(
        "posts_with_uuid.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    // Should only get posts for the target users due to INNER JOIN condition
    expect(postsWithUsers).toHaveLength(2);
    expect(postsWithUsers[0].userName).toBeDefined();
    expect(postsWithUsers[1].userName).toBeDefined();
  });

  test("uuid pk innerJoin with all params", async () => {
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
      .select(["users_with_uuid.name", "userName"])
      .innerJoin(
        "users_with_uuid",
        "users_with_uuid.id",
        "posts_with_uuid.user_id",
        "=",
      )
      .whereIn(
        "posts_with_uuid.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(3);
    expect(postsWithUsers[0].userName).toBeDefined();
  });

  test("uuid pk innerJoin with optional primaryColumn", async () => {
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
      .select(["users_with_uuid.name", "userName"])
      .innerJoin(
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
    expect(postsWithUsers[0].userName).toBeDefined();
  });

  test("uuid pk innerJoin with default operator", async () => {
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
      .select(["users_with_uuid.name", "userName"])
      .innerJoin(
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
    expect(postsWithUsers[0].userName).toBeDefined();
  });

  test("uuid pk innerJoin with Model and all params", async () => {
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
      .select(["users_with_uuid.name", "userName"])
      .innerJoin(UserWithUuid, "id", "userId", "=")
      .whereIn(
        "posts_with_uuid.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(3);
    expect(postsWithUsers[0].userName).toBeDefined();
  });

  test("uuid pk innerJoin with Model and optional primaryColumn", async () => {
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
      .select(["users_with_uuid.name", "userName"])
      .innerJoin(UserWithUuid, "id", "userId")
      .whereIn(
        "posts_with_uuid.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(3);
    expect(postsWithUsers[0].userName).toBeDefined();
  });

  test("uuid pk innerJoin with Model and default operator", async () => {
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
      .select(["users_with_uuid.name", "userName"])
      .innerJoin(UserWithUuid, "id", "userId")
      .whereIn(
        "posts_with_uuid.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(3);
    expect(postsWithUsers[0].userName).toBeDefined();
  });

  test("uuid pk innerJoin with callback", async () => {
    const users = await UserFactory.userWithUuid(3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const targetUser = users[0];

    const postsWithUsers = await PostWithUuid.query()
      .select("posts_with_uuid.*")
      .select(["users_with_uuid.name", "userName"])
      .innerJoin(
        "users_with_uuid",
        "users_with_uuid.id",
        "posts_with_uuid.user_id",
        (q) => q.where("users_with_uuid.id", targetUser.id),
      )
      .whereIn(
        "posts_with_uuid.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(1);
    expect(postsWithUsers[0].userName).toBeDefined();
    expect(postsWithUsers[0].userName).toBe(targetUser.name);
  });

  test("uuid pk innerJoin with callback and explicit operator", async () => {
    const users = await UserFactory.userWithUuid(3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const targetUser = users[0];

    const postsWithUsers = await PostWithUuid.query()
      .select("posts_with_uuid.*")
      .select(["users_with_uuid.name", "userName"])
      .innerJoin(
        "users_with_uuid",
        "users_with_uuid.id",
        "posts_with_uuid.user_id",
        "=",
        (q) => q.where("users_with_uuid.id", targetUser.id),
      )
      .whereIn(
        "posts_with_uuid.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(1);
    expect(postsWithUsers[0].userName).toBeDefined();
    expect(postsWithUsers[0].userName).toBe(targetUser.name);
  });

  test("uuid pk innerJoin with Model and callback", async () => {
    const users = await UserFactory.userWithUuid(3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const targetUser = users[0];

    const postsWithUsers = await PostWithUuid.query()
      .select("posts_with_uuid.*")
      .select(["users_with_uuid.name", "userName"])
      .innerJoin(UserWithUuid, "id", "userId", (q) =>
        q.where("users_with_uuid.id", targetUser.id),
      )
      .whereIn(
        "posts_with_uuid.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(1);
    expect(postsWithUsers[0].userName).toBeDefined();
    expect(postsWithUsers[0].userName).toBe(targetUser.name);
  });

  test("uuid pk innerJoin with Model, operator and callback", async () => {
    const users = await UserFactory.userWithUuid(3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const targetUser = users[0];

    const postsWithUsers = await PostWithUuid.query()
      .select("posts_with_uuid.*")
      .select(["users_with_uuid.name", "userName"])
      .innerJoin(UserWithUuid, "id", "userId", "=", (q) =>
        q.where("users_with_uuid.id", targetUser.id),
      )
      .whereIn(
        "posts_with_uuid.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(1);
    expect(postsWithUsers[0].userName).toBeDefined();
    expect(postsWithUsers[0].userName).toBe(targetUser.name);
  });
});
