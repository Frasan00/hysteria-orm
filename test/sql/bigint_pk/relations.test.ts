import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import {
  AddressWithBigint,
  PostWithBigint,
  UserWithBigint,
} from "../test_models/bigint/schema";
import { AddressFactory } from "../test_models/factory/address_factory";
import { PostFactory } from "../test_models/factory/post_factory";
import { UserAddressFactory } from "../test_models/factory/user_address_factory";
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

describe(`[${env.DB_TYPE}] bigint pk base relations`, () => {
  if (env.DB_TYPE === "cockroachdb") {
    test.skip("bigint HasOne relation", async () => {});
    test.skip("bigint HasMany relation with filtering on the relation", async () => {});
    test.skip("bigint HasOne relation nested with a belongs to relation", async () => {});
    test.skip("bigint with multiple nested relations", async () => {});
    test.skip("bigint HasMany relation", async () => {});
    return;
  }

  test("bigint HasOne relation", async () => {
    const users = await UserFactory.userWithBigint(sql, 3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithBigint(sql, user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const userWithLoadedPosts = await sql
      .from(UserWithBigint)
      .load("post")
      .many();

    for (const user of userWithLoadedPosts) {
      expect(user.id).toBe(user.post?.userId);
    }
  });

  test("bigint HasOne relation with column selection on relation", async () => {
    const users = await UserFactory.userWithBigint(sql, 3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithBigint(sql, user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const userWithLoadedPosts = await sql
      .from(UserWithBigint)
      .whereIn(
        "id",
        users.map((u) => u.id),
      )
      .load("post", (qb) => qb.select("posts_with_bigint.userId", "title"))
      .many();

    for (const user of userWithLoadedPosts) {
      expect(user.id).toBe(user.post?.userId);
      expect(user.post?.title).toBe(
        userWithLoadedPosts.find((u) => u.id === user.id)?.post?.title,
      );
      // Non-selected columns should not exist at runtime
      expect(Object.prototype.hasOwnProperty.call(user.post, "id")).toBe(false);
    }
  });

  test("bigint HasMany relation with filtering on the relation", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    const posts: any[] = [];
    for (let i = 0; i < 3; i++) {
      const post = await PostFactory.postWithBigint(sql, user.id, 1);
      posts.push(post);
    }

    expect(user).toBeDefined();
    expect(posts).toHaveLength(3);

    const userWithLoadedPosts = await sql
      .from(UserWithBigint)
      .where("id", user.id)
      .load("posts", (qb) => qb.where("title", posts[0].title))
      .one();

    expect(userWithLoadedPosts).toBeDefined();
    expect(userWithLoadedPosts?.posts).toHaveLength(1);
    expect(userWithLoadedPosts?.posts[0].title).toBe(posts[0].title);
  });

  test("bigint HasOne relation nested with a belongs to relation", async () => {
    const users = await UserFactory.userWithBigint(sql, 3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithBigint(sql, user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const userWithLoadedPosts = await sql
      .from(UserWithBigint)
      .load("post", (qb) => qb.load("user"))
      .many();

    for (const user of userWithLoadedPosts) {
      expect(user.id).toBe(user.post?.userId);
      expect(user.post?.user?.id).toBe(user.id);
    }
  });

  test("bigint with multiple nested relations", async () => {
    const users = await UserFactory.userWithBigint(sql, 3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithBigint(sql, user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const userWithLoadedPosts = await sql
      .from(UserWithBigint)
      .load("post", (qb) =>
        qb.load("user", (qb2) => qb2.load("post", (qb3) => qb3.load("user"))),
      )
      .many();

    for (const user of userWithLoadedPosts) {
      expect(user.id).toBe(user.post?.user?.id);
      expect(user.post?.user?.id).toBe(user.id);
      expect(user.post?.user?.post?.user?.id).toBe(user.id);
    }
  });

  test("bigint HasMany relation", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    const posts = [];
    for (let i = 0; i < 3; i++) {
      const post = await PostFactory.postWithBigint(sql, user.id, 1);
      posts.push(post);
    }

    expect(user).toBeDefined();
    expect(posts).toHaveLength(3);

    const userWithLoadedPosts = await sql
      .from(UserWithBigint)
      .where("id", user.id)
      .load("posts")
      .oneOrFail();

    expect(userWithLoadedPosts).toBeDefined();
    expect(userWithLoadedPosts.posts).toHaveLength(3);
    for (const post of userWithLoadedPosts.posts) {
      expect(post.userId).toBe(user.id);
    }

    expect(userWithLoadedPosts).toBeDefined();
    expect(userWithLoadedPosts.posts).toHaveLength(3);
    for (const post of userWithLoadedPosts.posts) {
      expect(post.userId).toBe(user.id);
    }
  });
});

describe(`[${env.DB_TYPE}] bigint pk many to many relations`, () => {
  if (env.DB_TYPE === "cockroachdb") {
    test.skip("bigint many to many relation", async () => {});
    test.skip("bigint many to many relation nested from Address", async () => {});
    return;
  }

  test("bigint many to many relation", async () => {
    const users = await UserFactory.userWithBigint(sql, 10);
    const addresses = await AddressFactory.addressWithBigint(sql, 6);

    // #region first user has 3 addresses
    await UserAddressFactory.userAddressWithBigint(
      sql,
      1,
      users[0].id,
      addresses[0].id,
    );
    await UserAddressFactory.userAddressWithBigint(
      sql,
      1,
      users[0].id,
      addresses[1].id,
    );
    await UserAddressFactory.userAddressWithBigint(
      sql,
      1,
      users[0].id,
      addresses[2].id,
    );

    // #endregion

    // #region second user has 2 addresses
    await UserAddressFactory.userAddressWithBigint(
      sql,
      1,
      users[1].id,
      addresses[3].id,
    );
    await UserAddressFactory.userAddressWithBigint(
      sql,
      1,
      users[1].id,
      addresses[4].id,
    );
    // #endregion

    // #region third user has 1 address
    await UserAddressFactory.userAddressWithBigint(
      sql,
      1,
      users[2].id,
      addresses[5].id,
    );
    // #endregion

    const userWithLoadedAddresses = await sql
      .from(UserWithBigint)
      .load("addresses", (qb) => qb.load("users"))
      .many();

    expect(userWithLoadedAddresses).toHaveLength(10);
    for (const user of userWithLoadedAddresses) {
      if (user.id === users[0].id) {
        expect(user.addresses).toHaveLength(3);
      } else if (user.id === users[1].id) {
        expect(user.addresses).toHaveLength(2);
      } else if (user.id === users[2].id) {
        expect(user.addresses).toHaveLength(1);
      } else {
        expect(user.addresses).toHaveLength(0);
      }
    }
  });

  test("bigint many to many relation nested from Address", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    const addresses = await AddressFactory.addressWithBigint(sql, 3);

    // #region first user has 3 addresses
    await UserAddressFactory.userAddressWithBigint(
      sql,
      1,
      user.id,
      addresses[0].id,
    );
    await UserAddressFactory.userAddressWithBigint(
      sql,
      1,
      user.id,
      addresses[1].id,
    );
    await UserAddressFactory.userAddressWithBigint(
      sql,
      1,
      user.id,
      addresses[2].id,
    );

    // #region first user has 3 posts
    await PostFactory.postWithBigint(sql, user.id, 3);
    // #endregion

    const addressesWithLoadedPosts = await sql
      .from(AddressWithBigint)
      .load("users", (qb) =>
        qb.load("posts", (qb2) =>
          qb2.load("user", (qb3) =>
            qb3.load("addresses", (qb4) => qb4.load("users")),
          ),
        ),
      )
      .many();

    expect(addressesWithLoadedPosts).toHaveLength(3);
    expect(addressesWithLoadedPosts[0].users).toHaveLength(1);
    expect(addressesWithLoadedPosts[0].users[0]?.posts).toHaveLength(3);
    expect(
      (addressesWithLoadedPosts[0].users[0] as any)?.posts[0]?.user?.id,
    ).toBe(user.id);
    expect(
      (addressesWithLoadedPosts[0].users[0] as any)?.posts[0]?.user?.addresses,
    ).toHaveLength(3);
  });
});

describe(`[${env.DB_TYPE}] bigint pk relations with limit and offset has many`, () => {
  // MSSQL: Ambiguous column name 'title' in CTE with ROW_NUMBER() - orderByRaw doesn't qualify columns
  if (env.DB_TYPE === "cockroachdb" || env.DB_TYPE === "mssql") {
    test.skip("bigint HasMany relation with limit and offset", async () => {});
    test.skip("bigint HasMany relation with limit", async () => {});
    test.skip("bigint HasMany relation with offset", async () => {});
    return;
  }

  test("bigint HasMany relation with limit and offset", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    const user2 = await UserFactory.userWithBigint(sql, 1);
    await PostFactory.postWithBigint(sql, user.id, 10);
    await PostFactory.postWithBigint(sql, user2.id, 10);

    const userWithLoadedPosts = await sql
      .from(UserWithBigint)
      .load("posts", (qb) =>
        qb
          .select("id", "title", "userId")
          .orderBy("id", "asc")
          .orderByRaw("title asc")
          .limit(3)
          .offset(1),
      )
      .many();

    expect(userWithLoadedPosts).toHaveLength(2);
    expect(userWithLoadedPosts[0].posts).toHaveLength(3);
    expect(userWithLoadedPosts[1].posts).toHaveLength(3);
  });

  test("bigint HasMany relation with limit", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    const user2 = await UserFactory.userWithBigint(sql, 1);
    await PostFactory.postWithBigint(sql, user.id, 10);
    await PostFactory.postWithBigint(sql, user2.id, 10);

    const userWithLoadedPosts = await sql
      .from(UserWithBigint)
      .load("posts", (qb) =>
        qb
          .select("id", "title", "userId")
          .orderBy("id", "asc")
          .orderByRaw("title asc")
          .limit(3),
      )
      .many();

    expect(userWithLoadedPosts).toHaveLength(2);
    expect(userWithLoadedPosts[0].posts).toHaveLength(3);
    expect(userWithLoadedPosts[1].posts).toHaveLength(3);
  });

  test("bigint HasMany relation with offset", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    const user2 = await UserFactory.userWithBigint(sql, 1);
    await PostFactory.postWithBigint(sql, user.id, 10);
    await PostFactory.postWithBigint(sql, user2.id, 10);

    const userWithLoadedPosts = await sql
      .from(UserWithBigint)
      .load("posts", (qb) =>
        qb
          .select("id", "title", "userId")
          .orderBy("id", "asc")
          .orderByRaw("title asc")
          .offset(9),
      )
      .many();

    expect(userWithLoadedPosts).toHaveLength(2);
    expect(userWithLoadedPosts[0].posts).toHaveLength(1);
    expect(userWithLoadedPosts[1].posts).toHaveLength(1);
  });
});

describe(`[${env.DB_TYPE}] bigint pk relations with limit and offset many to many`, () => {
  // MSSQL: Ambiguous column name in CTE with ROW_NUMBER() - orderByRaw doesn't qualify columns
  if (env.DB_TYPE === "cockroachdb" || env.DB_TYPE === "mssql") {
    test.skip("bigint ManyToMany relation with limit and offset", async () => {});
    test.skip("bigint ManyToMany relation with limit", async () => {});
    test.skip("bigint ManyToMany relation with offset", async () => {});
    return;
  }

  test("bigint ManyToMany relation with limit and offset", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    const user2 = await UserFactory.userWithBigint(sql, 1);
    const addresses = await AddressFactory.addressWithBigint(sql, 10);

    for (const address of addresses) {
      await UserAddressFactory.userAddressWithBigint(
        sql,
        1,
        user.id,
        address.id,
      );
      await UserAddressFactory.userAddressWithBigint(
        sql,
        1,
        user2.id,
        address.id,
      );
    }

    const usersWithAddresses = await sql
      .from(UserWithBigint)
      .load("addresses", (qb) =>
        qb.orderBy("address_with_bigint.id", "asc").limit(3).offset(1),
      )
      .many();

    expect(usersWithAddresses).toHaveLength(2);
    expect(usersWithAddresses[0].addresses).toHaveLength(3);
    expect(usersWithAddresses[1].addresses).toHaveLength(3);
    expect(usersWithAddresses[0].addresses[0].id).toBeDefined();
  });

  test("bigint ManyToMany relation with limit", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    const user2 = await UserFactory.userWithBigint(sql, 1);
    const addresses = await AddressFactory.addressWithBigint(sql, 10);

    for (const address of addresses) {
      await UserAddressFactory.userAddressWithBigint(
        sql,
        1,
        user.id,
        address.id,
      );
      await UserAddressFactory.userAddressWithBigint(
        sql,
        1,
        user2.id,
        address.id,
      );
    }

    const usersWithAddresses = await sql
      .from(UserWithBigint)
      .load("addresses", (qb) =>
        qb.orderBy("address_with_bigint.id", "asc").limit(3),
      )
      .many();

    expect(usersWithAddresses).toHaveLength(2);
    expect(usersWithAddresses[0].addresses).toHaveLength(3);
    expect(usersWithAddresses[1].addresses).toHaveLength(3);
    expect(usersWithAddresses[0].addresses[0].id).toBeDefined();
  });

  test("bigint ManyToMany relation with offset", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    const user2 = await UserFactory.userWithBigint(sql, 1);
    const addresses = await AddressFactory.addressWithBigint(sql, 10);

    for (const address of addresses) {
      await UserAddressFactory.userAddressWithBigint(
        sql,
        1,
        user.id,
        address.id,
      );
      await UserAddressFactory.userAddressWithBigint(
        sql,
        1,
        user2.id,
        address.id,
      );
    }

    const usersWithAddresses = await sql
      .from(UserWithBigint)
      .load("addresses", (qb) =>
        qb.orderBy("address_with_bigint.id", "asc").offset(9),
      )
      .many();

    expect(usersWithAddresses).toHaveLength(2);
    expect(usersWithAddresses[0].addresses).toHaveLength(1);
    expect(usersWithAddresses[1].addresses).toHaveLength(1);
    expect(usersWithAddresses[0].addresses[0].id).toBeDefined();
  });
});

describe(`[${env.DB_TYPE}] bigint pk relation edge cases`, () => {
  if (env.DB_TYPE === "cockroachdb") {
    test.skip("skipped on cockroachdb", () => {});
    return;
  }

  // ── Column selection edge cases ──────────────────────────────────────────

  test("bigint wildcard select(*) returns all columns on relation", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    await PostFactory.postWithBigint(sql, user.id, 1);

    const result = await sql
      .from(UserWithBigint)
      .where("id", user.id)
      .load("post", (qb) => qb.select("*"))
      .one();

    expect(result?.post).not.toBeNull();
    expect(result?.post?.id).toBeDefined();
    expect(result?.post?.title).toBeDefined();
    expect(result?.post?.userId).toBeDefined();
  });

  test("bigint table.* wildcard select returns all columns on relation", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    await PostFactory.postWithBigint(sql, user.id, 1);

    const result = await sql
      .from(UserWithBigint)
      .where("id", user.id)
      .load("post", (qb) => qb.select("posts_with_bigint.*"))
      .one();

    expect(result?.post).not.toBeNull();
    expect(result?.post?.id).toBeDefined();
    expect(result?.post?.title).toBeDefined();
    expect(result?.post?.userId).toBeDefined();
  });

  test("bigint table.column format select works on relation", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    const post = await PostFactory.postWithBigint(sql, user.id, 1);

    const result = await sql
      .from(UserWithBigint)
      .where("id", user.id)
      .load("post", (qb) =>
        qb.select("posts_with_bigint.userId", "posts_with_bigint.title"),
      )
      .one();

    expect(result?.post?.userId).toBe(user.id);
    expect(result?.post?.title).toBe((post as any).title);
  });

  test("bigint alias tuple select gives aliased keys on relation", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    const post = await PostFactory.postWithBigint(sql, user.id, 1);

    const result = await sql
      .from(UserWithBigint)
      .where("id", user.id)
      .load("post", (qb) => qb.select("userId", ["title", "postTitle"] as any))
      .one();

    expect((result?.post as any)?.postTitle).toBe((post as any).title);
    expect(result?.post?.userId).toBe(user.id);
  });

  test("bigint type narrowing with select: only selected keys present", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    await PostFactory.postWithBigint(sql, user.id, 1);

    const result = await sql
      .from(UserWithBigint)
      .where("id", user.id)
      .load("post", (qb) => qb.select("id", "userId"))
      .one();

    expect(result?.post?.id).toBeDefined();
    expect(result?.post?.userId).toBe(user.id);
    expect(Object.prototype.hasOwnProperty.call(result?.post, "title")).toBe(
      false,
    );
  });

  test("bigint hasMany column selection with select", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    await PostFactory.postWithBigint(sql, user.id, 3);

    const result = await sql
      .from(UserWithBigint)
      .where("id", user.id)
      .load("posts", (qb) => qb.select("id", "userId", "title"))
      .one();

    expect(result?.posts).toHaveLength(3);
    for (const post of result?.posts ?? []) {
      expect(post.id).toBeDefined();
      expect(post.userId).toBe(user.id);
      expect(post.title).toBeDefined();
      expect(Object.prototype.hasOwnProperty.call(post, "content")).toBe(false);
    }
  });

  test("bigint manyToMany column selection with select", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    const addresses = await AddressFactory.addressWithBigint(sql, 3);
    for (const address of addresses) {
      await UserAddressFactory.userAddressWithBigint(
        sql,
        1,
        user.id,
        address.id,
      );
    }

    const result = await sql
      .from(UserWithBigint)
      .where("id", user.id)
      .load("addresses", (qb) => qb.select("id", "city"))
      .one();

    expect(result?.addresses).toHaveLength(3);
    for (const address of result?.addresses ?? []) {
      expect(address.id).toBeDefined();
      expect(address.city).toBeDefined();
      expect(Object.prototype.hasOwnProperty.call(address, "street")).toBe(
        false,
      );
    }
  });

  // ── Standalone belongsTo ─────────────────────────────────────────────────

  test("bigint standalone belongsTo loads the parent user", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    await PostFactory.postWithBigint(sql, user.id, 3);

    const posts = await sql
      .from(PostWithBigint)
      .where("userId", user.id)
      .load("user")
      .many();

    expect(posts.length).toBeGreaterThan(0);
    for (const post of posts) {
      expect(post.user?.id).toBe(user.id);
    }
  });

  // ── All parents have no related records ─────────────────────────────────

  test("bigint hasMany returns empty array when no related records exist", async () => {
    const users = await UserFactory.userWithBigint(sql, 3);

    const result = await sql
      .from(UserWithBigint)
      .whereIn(
        "id",
        users.map((u) => u.id),
      )
      .load("posts")
      .many();

    expect(result).toHaveLength(3);
    for (const user of result) {
      expect(user.posts).toEqual([]);
    }
  });

  test("bigint hasOne returns null when no related record exists", async () => {
    const users = await UserFactory.userWithBigint(sql, 3);

    const result = await sql
      .from(UserWithBigint)
      .whereIn(
        "id",
        users.map((u) => u.id),
      )
      .load("post")
      .many();

    expect(result).toHaveLength(3);
    for (const user of result) {
      expect(user.post).toBeNull();
    }
  });

  test("bigint manyToMany returns empty array when no relations exist", async () => {
    const users = await UserFactory.userWithBigint(sql, 2);

    const result = await sql
      .from(UserWithBigint)
      .whereIn(
        "id",
        users.map((u) => u.id),
      )
      .load("addresses")
      .many();

    expect(result).toHaveLength(2);
    for (const user of result) {
      expect(user.addresses).toEqual([]);
    }
  });

  // ── Multiple loads on same query ─────────────────────────────────────────

  test("bigint multiple loads on same query return all relations", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    await PostFactory.postWithBigint(sql, user.id, 2);
    const addresses = await AddressFactory.addressWithBigint(sql, 3);
    for (const address of addresses) {
      await UserAddressFactory.userAddressWithBigint(
        sql,
        1,
        user.id,
        address.id,
      );
    }

    const result = await sql
      .from(UserWithBigint)
      .where("id", user.id)
      .load("posts")
      .load("addresses")
      .one();

    expect(result?.posts).toHaveLength(2);
    expect(result?.addresses).toHaveLength(3);
  });

  // ── OrderBy on relation ──────────────────────────────────────────────────

  test("bigint orderBy on relation returns posts in correct order", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    for (let i = 0; i < 3; i++) {
      await PostFactory.postWithBigint(sql, user.id, 1);
    }

    const result = await sql
      .from(UserWithBigint)
      .where("id", user.id)
      .load("posts", (qb) => qb.orderBy("posts_with_bigint.id", "desc"))
      .one();

    expect(result?.posts).toHaveLength(3);
    const ids = result?.posts.map((p) => p.id as number) ?? [];
    expect(ids[0]).toBeGreaterThan(ids[1]);
    expect(ids[1]).toBeGreaterThan(ids[2]);
  });

  // ── OrWhere on relation ──────────────────────────────────────────────────

  test("bigint orWhere on relation filters correctly", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    const post1 = await PostFactory.postWithBigint(sql, user.id, 1);
    const post2 = await PostFactory.postWithBigint(sql, user.id, 1);
    await PostFactory.postWithBigint(sql, user.id, 1);

    const result = await sql
      .from(UserWithBigint)
      .where("id", user.id)
      .load("posts", (qb) =>
        qb
          .where("title", (post1 as any).title)
          .orWhere("title", (post2 as any).title),
      )
      .one();

    expect(result?.posts).toHaveLength(2);
    const titles = result?.posts.map((p) => p.title);
    expect(titles).toContain((post1 as any).title);
    expect(titles).toContain((post2 as any).title);
  });
});

describe(`[${env.DB_TYPE}] bigint pk sync many to many`, () => {
  test("bigint sync many to many", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    const addresses = await AddressFactory.addressWithBigint(sql, 10);

    await sql.from(UserWithBigint).sync("addresses", user, addresses);

    const userWithAddresses = await sql
      .from(UserWithBigint)
      .where("id", user.id)
      .load("addresses")
      .one();

    expect(userWithAddresses).toBeDefined();
    expect(userWithAddresses?.addresses).toHaveLength(10);

    const addressesWithUsers = await sql
      .from(AddressWithBigint)
      .whereIn(
        "id",
        addresses.map((a: any) => a.id),
      )
      .load("users")
      .many();

    expect(addressesWithUsers).toHaveLength(10);
    for (const address of addressesWithUsers) {
      expect(address.users).toHaveLength(1);
    }
  });
});
