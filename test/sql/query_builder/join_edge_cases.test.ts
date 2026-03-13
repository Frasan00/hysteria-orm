import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { AddressFactory } from "../test_models/factory/address_factory";
import { PostFactory } from "../test_models/factory/post_factory";
import { UserAddressFactory } from "../test_models/factory/user_address_factory";
import { UserFactory } from "../test_models/factory/user_factory";
import { PostWithUuid } from "../test_models/uuid/schema";

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

describe(`[${env.DB_TYPE}] uuid pk join edge cases`, () => {
  test("left join with null foreign key returns rows and undefined columns", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);
    const linkedPost = await PostFactory.postWithUuid(sql, user.id, 1);
    const orphanPost = await sql.from(PostWithUuid).insert(
      {
        ...PostFactory.getCommonPostData(),
        userId: null as unknown as string,
      },
      { returning: ["*"] },
    );

    const postsWithUsers = await sql
      .from(PostWithUuid)
      .select("posts_with_uuid.*", ["users_with_uuid.name", "userName"])
      .leftJoin(
        "users_with_uuid",
        "users_with_uuid.id",
        "posts_with_uuid.user_id",
      )
      .whereIn("posts_with_uuid.id", [linkedPost.id, orphanPost.id])
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    expect(postsWithUsers).toHaveLength(2);
    const [first, second] = postsWithUsers;
    const userNameValues = [first.userName, second.userName];
    // one defined, one null
    if (!userNameValues.some((n) => n)) {
      throw new Error();
    }

    if (!userNameValues.some((n) => !n)) {
      throw new Error();
    }
  });

  test("multi-join chain through pivot to addresses", async () => {
    const users = await UserFactory.userWithUuid(sql, 3);
    const posts = [] as { id: string }[];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(sql, user.id, 1);
      posts.push(post);
    }

    const addresses = await AddressFactory.addressWithUuid(sql, 3);
    for (let i = 0; i < users.length; i++) {
      await UserAddressFactory.userAddressWithUuid(
        sql,
        1,
        users[i].id,
        addresses[i].id,
      );
    }

    const rows = await sql
      .from(PostWithUuid)
      .select(
        "posts_with_uuid.*",
        ["users_with_uuid.name", "userName"],
        ["address_with_uuid.city", "city"],
      )
      .leftJoin(
        "users_with_uuid",
        "users_with_uuid.id",
        "posts_with_uuid.user_id",
      )
      .leftJoin(
        "user_address_with_uuid",
        "user_address_with_uuid.user_id",
        "users_with_uuid.id",
      )
      .leftJoin(
        "address_with_uuid",
        "address_with_uuid.id",
        "user_address_with_uuid.address_id",
      )
      .whereIn(
        "posts_with_uuid.id",
        posts.map((p) => p.id),
      )
      .orderBy("posts_with_uuid.id", "asc")
      .many();

    expect(rows).toHaveLength(3);
    expect(rows[0].userName).toBeDefined();
    expect(rows[0].city).toBeDefined();
  });

  test("raw alias join chain using from aliases", async () => {
    const users = await UserFactory.userWithUuid(sql, 2);
    const posts = [] as { id: string }[];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(sql, user.id, 1);
      posts.push(post);
    }

    const addresses = await AddressFactory.addressWithUuid(sql, 2);
    for (let i = 0; i < users.length; i++) {
      await UserAddressFactory.userAddressWithUuid(
        sql,
        1,
        users[i].id,
        addresses[i].id,
      );
    }

    const rows = await sql
      .query("posts_with_uuid")
      .table("posts_with_uuid", "p")
      .select("p.*", ["u.name", "mustBe1"], ["a.city", "mustBe2"])
      .leftJoinRaw("users_with_uuid u ON u.id = p.user_id")
      .leftJoinRaw("user_address_with_uuid ua ON ua.user_id = u.id")
      .leftJoinRaw("address_with_uuid a ON a.id = ua.address_id")
      .whereIn(
        "p.id",
        posts.map((p) => p.id),
      )
      .orderBy("p.id", "asc")
      .many();

    expect(rows).toHaveLength(2);
    expect(rows[0].mustBe1).toBeDefined();
    expect(rows[0].mustBe2).toBeDefined();
  });

  test("selecting other-table columns does not bleed into model root", async () => {
    // MSSQL handles duplicate column names differently - later columns overwrite earlier ones
    // This causes issues when both tables have id, created_at, updated_at columns
    if (env.DB_TYPE === "mssql") {
      return;
    }

    const users = await UserFactory.userWithUuid(sql, 1);
    const post = await PostFactory.postWithUuid(sql, users.id, 1);

    const rows = await sql
      .from(PostWithUuid)
      .select("posts_with_uuid.*", "users_with_uuid.*")
      .leftJoin(
        "users_with_uuid",
        "users_with_uuid.id",
        "posts_with_uuid.user_id",
      )
      .whereIn("posts_with_uuid.id", [post.id])
      .many();

    expect(rows).toHaveLength(1);
    expect(Object.prototype.hasOwnProperty.call(rows[0], "name")).toBe(false);
  });

  test("invalid join column rejects", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);
    const post = await PostFactory.postWithUuid(sql, user.id, 1);

    const q = sql
      .from(PostWithUuid)
      .select("posts_with_uuid.*")
      .leftJoin(
        "users_with_uuid",
        "users_with_uuid.non_existing",
        "posts_with_uuid.user_id",
      )
      .whereIn("posts_with_uuid.id", [post.id]);

    await expect(q.many()).rejects.toThrow();
  });
});
