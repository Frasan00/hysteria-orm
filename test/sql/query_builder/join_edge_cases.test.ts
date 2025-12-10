import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { AddressFactory } from "../test_models/factory/address_factory";
import { PostFactory } from "../test_models/factory/post_factory";
import { UserAddressFactory } from "../test_models/factory/user_address_factory";
import { UserFactory } from "../test_models/factory/user_factory";
import { PostWithUuid } from "../test_models/uuid/post_uuid";

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

describe(`[${env.DB_TYPE}] uuid pk join edge cases`, () => {
  test("left join with null foreign key returns rows and undefined annotations", async () => {
    const user = await UserFactory.userWithUuid(1);
    const linkedPost = await PostFactory.postWithUuid(user.id, 1);
    const orphanPost = await PostWithUuid.insert({
      ...PostFactory.getCommonPostData(),
      userId: null as unknown as string,
    });

    const postsWithUsers = await PostWithUuid.query()
      .select("posts_with_uuid.*")
      .annotate("users_with_uuid.name", "userName")
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
    const userNameValues = [
      first.$annotations.userName,
      second.$annotations.userName,
    ];
    // one defined, one null
    if (!userNameValues.some((n) => n)) {
      throw new Error();
    }

    if (!userNameValues.some((n) => !n)) {
      throw new Error();
    }
  });

  test("multi-join chain through pivot to addresses", async () => {
    const users = await UserFactory.userWithUuid(3);
    const posts = [] as { id: string }[];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    const addresses = await AddressFactory.addressWithUuid(3);
    for (let i = 0; i < users.length; i++) {
      await UserAddressFactory.userAddressWithUuid(
        1,
        users[i].id,
        addresses[i].id,
      );
    }

    const rows = await PostWithUuid.query()
      .select("posts_with_uuid.*")
      .annotate("users_with_uuid.name", "userName")
      .annotate("address_with_uuid.city", "city")
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
    expect(rows[0].$annotations.userName).toBeDefined();
    expect(rows[0].$annotations.city).toBeDefined();
  });

  test("raw alias join chain using from aliases", async () => {
    const users = await UserFactory.userWithUuid(2);
    const posts = [] as { id: string }[];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    const addresses = await AddressFactory.addressWithUuid(2);
    for (let i = 0; i < users.length; i++) {
      await UserAddressFactory.userAddressWithUuid(
        1,
        users[i].id,
        addresses[i].id,
      );
    }

    const rows = await SqlDataSource.query("posts_with_uuid")
      .from("posts_with_uuid", "p")
      .select("p.*")
      .annotate("u.name", "mustBe1")
      .annotate("a.city", "mustBe2")
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

    const users = await UserFactory.userWithUuid(1);
    const post = await PostFactory.postWithUuid(users.id, 1);

    const rows = await PostWithUuid.query()
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
    const user = await UserFactory.userWithUuid(1);
    const post = await PostFactory.postWithUuid(user.id, 1);

    const q = PostWithUuid.query()
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
