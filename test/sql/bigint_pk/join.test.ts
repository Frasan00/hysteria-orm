import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { PostWithBigint, UserWithBigint } from "../test_models/bigint/schema";
import { PostFactory } from "../test_models/factory/post_factory";
import { UserFactory } from "../test_models/factory/user_factory";

let sql: SqlDataSource;

beforeAll(async () => {
  sql = new SqlDataSource();
  await sql.connect();
});

afterAll(async () => {
  await sql.disconnect();
});

beforeEach(async () => {
  await sql.startGlobalTransaction();
});

afterEach(async () => {
  await sql.rollbackGlobalTransaction();
});

describe(`[${env.DB_TYPE}] bigint pk join`, () => {
  test("bigint pk simple join", async () => {
    if (env.DB_TYPE === "cockroachdb") {
      console.log("CockroachDB breaks on bigint pk join");
      return;
    }

    const users = await UserFactory.userWithBigint(sql, 3);
    const posts = [];
    for (const user of users) {
      posts.push(await PostFactory.postWithBigint(sql, +user.id, 1));
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const postsWithUsers = await sql
      .from(PostWithBigint)
      .select("posts_with_bigint.*", ["users_with_bigint.name", "userName"])
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
    expect(postsWithUsers[0].userName).toBeDefined();
    expect(postsWithUsers[1].userName).toBeDefined();
    expect(postsWithUsers[2].userName).toBeDefined();

    const columns = PostWithBigint.getColumns();
    expect(Object.keys(postsWithUsers[0]).length - 1).toEqual(columns.length); // ignore additional
  });

  test("bigint pk simple left join", async () => {
    if (env.DB_TYPE === "cockroachdb") {
      console.log("CockroachDB breaks on bigint pk join");
      return;
    }

    const users = await UserFactory.userWithBigint(sql, 3);
    const posts = [];
    for (const user of users) {
      posts.push(await PostFactory.postWithBigint(sql, user.id, 1));
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const postsWithUsers = await sql
      .from(PostWithBigint)
      .select("posts_with_bigint.*", ["users_with_bigint.name", "userName"])
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
    expect(postsWithUsers[0].userName).toBeDefined();
  });

  test("bigint pk simple right join", async () => {
    if (env.DB_TYPE === "cockroachdb") {
      console.log("CockroachDB breaks on bigint pk join");
      return;
    }

    const users = await UserFactory.userWithBigint(sql, 3);
    const posts = [];
    for (const user of users) {
      posts.push(await PostFactory.postWithBigint(sql, user.id, 1));
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const postsWithUsers = await sql
      .from(PostWithBigint)
      .select("posts_with_bigint.*", ["users_with_bigint.name", "userName"])
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
    expect(postsWithUsers[0].userName).toBeDefined();
  });

  test("bigint pk simple Model join", async () => {
    if (env.DB_TYPE === "cockroachdb") {
      console.log("CockroachDB breaks on bigint pk join");
      return;
    }

    const users = await UserFactory.userWithBigint(sql, 3);
    const posts = [];
    for (const user of users) {
      posts.push(await PostFactory.postWithBigint(sql, user.id, 1));
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const postsWithUsers = await sql
      .from(PostWithBigint)
      .select("posts_with_bigint.*", ["users_with_bigint.name", "userName"])
      .join(UserWithBigint, "id", "userId")
      .whereIn(
        "posts_with_bigint.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_bigint.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(3);
    expect(postsWithUsers[0].userName).toBeDefined();
  });

  test("bigint pk simple Model left join", async () => {
    if (env.DB_TYPE === "cockroachdb") {
      console.log("CockroachDB breaks on bigint pk join");
      return;
    }

    const users = await UserFactory.userWithBigint(sql, 3);
    const posts = [];
    for (const user of users) {
      posts.push(await PostFactory.postWithBigint(sql, user.id, 1));
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const postsWithUsers = await sql
      .from(PostWithBigint)
      .select("posts_with_bigint.*", ["users_with_bigint.name", "userName"])
      .leftJoin(UserWithBigint, "id", "userId")
      .whereIn(
        "posts_with_bigint.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_bigint.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(3);
    expect(postsWithUsers[0].userName).toBeDefined();
  });

  test("bigint pk join with a custom operator", async () => {
    if (env.DB_TYPE === "cockroachdb") {
      return;
    }

    const users = await UserFactory.userWithBigint(sql, 3);
    const posts = [];
    for (const user of users) {
      posts.push(await PostFactory.postWithBigint(sql, user.id, 1));
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const postsWithUsers = await sql
      .from(PostWithBigint)
      .select("posts_with_bigint.*", ["users_with_bigint.name", "userName"])
      .join(UserWithBigint, "id", "userId", ">")
      .whereIn(
        "posts_with_bigint.id",
        posts.map((post) => post.id),
      )
      .orderBy("posts_with_bigint.id", "asc")
      .many();

    expect(postsWithUsers).toBeDefined();
  });
});
