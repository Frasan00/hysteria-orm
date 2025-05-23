import { env } from "../../../src/env/env";
import { getModelColumns } from "../../../src/sql/models/decorators/model_decorators";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { PostWithBigint } from "../test_models/bigint/post_bigint";
import { UserWithBigint } from "../test_models/bigint/user_bigint";
import { PostFactory } from "../test_models/factory/post_factory";
import { UserFactory } from "../test_models/factory/user_factory";

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

describe(`[${env.DB_TYPE}] bigint pk join`, () => {
  test("bigint pk simple join", async () => {
    if (env.DB_TYPE === "cockroachdb") {
      console.log("CockroachDB breaks on bigint pk join");
      return;
    }

    const users = await UserFactory.userWithBigint(3);
    const posts = [];
    for (const user of users) {
      posts.push(await PostFactory.postWithBigint(+user.id, 1));
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const postsWithUsers = await PostWithBigint.query()
      .select("posts_with_bigint.*")
      .annotate("users_with_bigint.name", "userName")
      .leftJoin(
        "users_with_bigint",
        "users_with_bigint.id",
        "posts_with_bigint.user_id",
      )
      .whereIn(
        "posts_with_bigint.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_bigint.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(3);
    expect(postsWithUsers[0].$annotations.userName).toBeDefined();
    expect(postsWithUsers[1].$annotations.userName).toBeDefined();
    expect(postsWithUsers[2].$annotations.userName).toBeDefined();

    const columns = getModelColumns(PostWithBigint);
    expect(Object.keys(postsWithUsers[0]).length - 1).toEqual(columns.length); // ignore additional
  });

  test("bigint pk simple left join", async () => {
    if (env.DB_TYPE === "cockroachdb") {
      console.log("CockroachDB breaks on bigint pk join");
      return;
    }

    const users = await UserFactory.userWithBigint(3);
    const posts = [];
    for (const user of users) {
      posts.push(await PostFactory.postWithBigint(user.id, 1));
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const postsWithUsers = await PostWithBigint.query()
      .select("posts_with_bigint.*")
      .annotate("users_with_bigint.name", "userName")
      .leftJoin(
        "users_with_bigint",
        "users_with_bigint.id",
        "posts_with_bigint.user_id",
      )
      .whereIn(
        "posts_with_bigint.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_bigint.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(3);
    expect(postsWithUsers[0].$annotations.userName).toBeDefined();
  });

  test("bigint pk simple right join", async () => {
    if (env.DB_TYPE === "cockroachdb") {
      console.log("CockroachDB breaks on bigint pk join");
      return;
    }

    const users = await UserFactory.userWithBigint(3);
    const posts = [];
    for (const user of users) {
      posts.push(await PostFactory.postWithBigint(user.id, 1));
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const postsWithUsers = await PostWithBigint.query()
      .select("posts_with_bigint.*")
      .annotate("users_with_bigint.name", "userName")
      .rightJoin(
        "users_with_bigint",
        "users_with_bigint.id",
        "posts_with_bigint.user_id",
      )
      .whereIn(
        "posts_with_bigint.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_bigint.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(3);
    expect(postsWithUsers[0].$annotations.userName).toBeDefined();
  });

  test("bigint pk simple Model join", async () => {
    if (env.DB_TYPE === "cockroachdb") {
      console.log("CockroachDB breaks on bigint pk join");
      return;
    }

    const users = await UserFactory.userWithBigint(3);
    const posts = [];
    for (const user of users) {
      posts.push(await PostFactory.postWithBigint(user.id, 1));
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const postsWithUsers = await PostWithBigint.query()
      .select("posts_with_bigint.*")
      .annotate("users_with_bigint.name", "userName")
      .join(UserWithBigint, "id", "userId")
      .whereIn(
        "posts_with_bigint.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_bigint.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(3);
    expect(postsWithUsers[0].$annotations.userName).toBeDefined();
  });

  test("bigint pk simple Model left join", async () => {
    if (env.DB_TYPE === "cockroachdb") {
      console.log("CockroachDB breaks on bigint pk join");
      return;
    }

    const users = await UserFactory.userWithBigint(3);
    const posts = [];
    for (const user of users) {
      posts.push(await PostFactory.postWithBigint(user.id, 1));
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const postsWithUsers = await PostWithBigint.query()
      .select("posts_with_bigint.*")
      .annotate("users_with_bigint.name", "userName")
      .leftJoin(UserWithBigint, "id", "userId")
      .whereIn(
        "posts_with_bigint.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_bigint.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(3);
    expect(postsWithUsers[0].$annotations.userName).toBeDefined();
  });

  test("bigint pk join with a custom operator", async () => {
    if (env.DB_TYPE === "cockroachdb") {
      console.log("CockroachDB breaks on bigint pk join");
      return;
    }

    const users = await UserFactory.userWithBigint(3);
    const posts = [];
    for (const user of users) {
      posts.push(await PostFactory.postWithBigint(user.id, 1));
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const postsWithUsers = PostWithBigint.query()
      .select("posts_with_bigint.*")
      .annotate("users_with_bigint.name", "userName")
      .join(UserWithBigint, "id", "userId", ">")
      .whereIn(
        "posts_with_bigint.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_bigint.id", "asc");

    expect(postsWithUsers.many()).resolves.toBeDefined();
  });
});
