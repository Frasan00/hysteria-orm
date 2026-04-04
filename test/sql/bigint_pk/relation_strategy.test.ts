import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { RelationEnum } from "../../../src/sql/models/relations/relation";
import {
  determineRelationStrategy,
  StrategyContext,
} from "../../../src/sql/models/model_query_builder/relation_strategy";
import { PostWithBigint, UserWithBigint } from "../test_models/bigint/schema";
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

// ─── Part 1: Unit Tests for determineRelationStrategy ──────────────────────

describe("determineRelationStrategy unit tests", () => {
  const baseContext: StrategyContext = {
    parentCount: 5,
    relationType: RelationEnum.hasMany,
    hasLimitOffset: false,
    hasOrderBy: false,
  };

  test("explicit strategy 'join' overrides auto", () => {
    const result = determineRelationStrategy(
      { ...baseContext, parentCount: 100 },
      { strategy: "join" },
    );
    expect(result).toBe("join");
  });

  test("explicit strategy 'batched' overrides auto", () => {
    const result = determineRelationStrategy(
      { ...baseContext, parentCount: 1 },
      { strategy: "batched" },
    );
    expect(result).toBe("batched");
  });

  test("auto with parentCount=1 returns 'join'", () => {
    const result = determineRelationStrategy(
      { ...baseContext, parentCount: 1 },
      { strategy: "auto" },
    );
    expect(result).toBe("join");
  });

  test("auto with parentCount=1 and no explicit strategy returns 'join'", () => {
    const result = determineRelationStrategy(
      { ...baseContext, parentCount: 1 },
      {},
    );
    expect(result).toBe("join");
  });

  test("auto with small parent set (<10) hasOne returns 'join'", () => {
    const result = determineRelationStrategy(
      { ...baseContext, parentCount: 5, relationType: RelationEnum.hasOne },
      { strategy: "auto" },
    );
    expect(result).toBe("join");
  });

  test("auto with small parent set (<10) hasMany returns 'join'", () => {
    const result = determineRelationStrategy(
      { ...baseContext, parentCount: 5, relationType: RelationEnum.hasMany },
      { strategy: "auto" },
    );
    expect(result).toBe("join");
  });

  test("auto with small parent set (<10) belongsTo returns 'join'", () => {
    const result = determineRelationStrategy(
      { ...baseContext, parentCount: 5, relationType: RelationEnum.belongsTo },
      { strategy: "auto" },
    );
    expect(result).toBe("join");
  });

  test("auto with small parent set (<=10) manyToMany returns 'join'", () => {
    const result = determineRelationStrategy(
      {
        ...baseContext,
        parentCount: 10,
        relationType: RelationEnum.manyToMany,
      },
      { strategy: "auto" },
    );
    expect(result).toBe("join");
  });

  test("auto with large parent set (>10) hasMany returns 'batched'", () => {
    const result = determineRelationStrategy(
      { ...baseContext, parentCount: 15, relationType: RelationEnum.hasMany },
      { strategy: "auto" },
    );
    expect(result).toBe("batched");
  });

  test("auto with large parent set (>10) manyToMany returns 'batched'", () => {
    const result = determineRelationStrategy(
      {
        ...baseContext,
        parentCount: 15,
        relationType: RelationEnum.manyToMany,
      },
      { strategy: "auto" },
    );
    expect(result).toBe("batched");
  });

  test("auto with hasLimitOffset and large set returns 'batched'", () => {
    const result = determineRelationStrategy(
      {
        ...baseContext,
        parentCount: 15,
        relationType: RelationEnum.hasMany,
        hasLimitOffset: true,
      },
      { strategy: "auto" },
    );
    expect(result).toBe("batched");
  });

  test("auto with hasLimitOffset and small set hasMany returns 'batched'", () => {
    const result = determineRelationStrategy(
      {
        ...baseContext,
        parentCount: 2,
        relationType: RelationEnum.hasMany,
        hasLimitOffset: true,
      },
      { strategy: "auto" },
    );
    expect(result).toBe("batched");
  });

  test("auto with hasLimitOffset and parentCount=1 hasMany returns 'batched'", () => {
    const result = determineRelationStrategy(
      {
        ...baseContext,
        parentCount: 1,
        relationType: RelationEnum.hasMany,
        hasLimitOffset: true,
      },
      { strategy: "auto" },
    );
    expect(result).toBe("batched");
  });

  test("auto with hasLimitOffset and hasOne returns 'join' (single result per parent)", () => {
    const result = determineRelationStrategy(
      {
        ...baseContext,
        parentCount: 1,
        relationType: RelationEnum.hasOne,
        hasLimitOffset: true,
      },
      { strategy: "auto" },
    );
    expect(result).toBe("join");
  });

  test("auto with unknown parentCount returns 'batched'", () => {
    const result = determineRelationStrategy(
      { ...baseContext, parentCount: "unknown" },
      { strategy: "auto" },
    );
    expect(result).toBe("batched");
  });
});

// ─── Part 2: Integration Tests — Strategy produces correct results ─────────

describe(`[${env.DB_TYPE}] relation strategy integration - hasOne`, () => {
  if (env.DB_TYPE === "cockroachdb") {
    test.skip("skipped on cockroachdb", () => {});
    return;
  }

  test("hasOne with explicit join strategy returns correct data", async () => {
    const users = await UserFactory.userWithBigint(sql, 3);
    for (const user of users) {
      await PostFactory.postWithBigint(sql, user.id, 1);
    }

    const result = await sql
      .from(UserWithBigint)
      .load("post", { strategy: "join" })
      .many();

    expect(result).toHaveLength(3);
    for (const user of result) {
      expect(user.post).toBeDefined();
      expect(user.post).not.toBeNull();
      expect(user.id).toBe(user.post?.userId);
    }
  });

  test("hasOne with explicit batched strategy returns correct data", async () => {
    const users = await UserFactory.userWithBigint(sql, 3);
    for (const user of users) {
      await PostFactory.postWithBigint(sql, user.id, 1);
    }

    const result = await sql
      .from(UserWithBigint)
      .load("post", { strategy: "batched" })
      .many();

    expect(result).toHaveLength(3);
    for (const user of result) {
      expect(user.post).toBeDefined();
      expect(user.post).not.toBeNull();
      expect(user.id).toBe(user.post?.userId);
    }
  });

  test("hasOne with join strategy returns null for missing relations", async () => {
    await UserFactory.userWithBigint(sql, 2);

    const result = await sql
      .from(UserWithBigint)
      .load("post", { strategy: "join" })
      .many();

    expect(result).toHaveLength(2);
    for (const user of result) {
      expect(user.post).toBeNull();
    }
  });

  test("hasOne join and batched strategies produce equivalent results", async () => {
    const users = await UserFactory.userWithBigint(sql, 3);
    for (const user of users) {
      await PostFactory.postWithBigint(sql, user.id, 1);
    }

    const joinResult = await sql
      .from(UserWithBigint)
      .load("post", { strategy: "join" })
      .many();

    const batchedResult = await sql
      .from(UserWithBigint)
      .load("post", { strategy: "batched" })
      .many();

    expect(joinResult).toHaveLength(batchedResult.length);
    for (const joinUser of joinResult) {
      const batchedUser = batchedResult.find((u) => u.id === joinUser.id);
      expect(batchedUser).toBeDefined();
      expect(joinUser.post?.userId).toBe(batchedUser?.post?.userId);
      expect(joinUser.post?.title).toBe(batchedUser?.post?.title);
    }
  });
});

describe(`[${env.DB_TYPE}] relation strategy integration - hasMany`, () => {
  if (env.DB_TYPE === "cockroachdb") {
    test.skip("skipped on cockroachdb", () => {});
    return;
  }

  test("hasMany with explicit join strategy returns correct data", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    await PostFactory.postWithBigint(sql, user.id, 3);

    const result = await sql
      .from(UserWithBigint)
      .where("id", user.id)
      .load("posts", { strategy: "join" })
      .one();

    expect(result).toBeDefined();
    expect(result?.posts).toHaveLength(3);
    for (const post of result?.posts ?? []) {
      expect(post.userId).toBe(user.id);
    }
  });

  test("hasMany with explicit batched strategy returns correct data", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    await PostFactory.postWithBigint(sql, user.id, 3);

    const result = await sql
      .from(UserWithBigint)
      .where("id", user.id)
      .load("posts", { strategy: "batched" })
      .one();

    expect(result).toBeDefined();
    expect(result?.posts).toHaveLength(3);
    for (const post of result?.posts ?? []) {
      expect(post.userId).toBe(user.id);
    }
  });

  test("hasMany with join returns empty array for no matching relations", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);

    const result = await sql
      .from(UserWithBigint)
      .where("id", user.id)
      .load("posts", { strategy: "join" })
      .one();

    expect(result).toBeDefined();
    expect(result?.posts).toHaveLength(0);
  });

  test("hasMany join and batched produce equivalent results", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    const user2 = await UserFactory.userWithBigint(sql, 1);
    await PostFactory.postWithBigint(sql, user.id, 3);
    await PostFactory.postWithBigint(sql, user2.id, 2);

    const joinResult = await sql
      .from(UserWithBigint)
      .whereIn("id", [user.id, user2.id])
      .load("posts", { strategy: "join" })
      .many();

    const batchedResult = await sql
      .from(UserWithBigint)
      .whereIn("id", [user.id, user2.id])
      .load("posts", { strategy: "batched" })
      .many();

    expect(joinResult).toHaveLength(batchedResult.length);
    for (const joinUser of joinResult) {
      const batchedUser = batchedResult.find((u) => u.id === joinUser.id);
      expect(batchedUser).toBeDefined();
      expect(joinUser.posts.length).toBe(batchedUser?.posts.length);
    }
  });
});

describe(`[${env.DB_TYPE}] relation strategy integration - belongsTo`, () => {
  if (env.DB_TYPE === "cockroachdb") {
    test.skip("skipped on cockroachdb", () => {});
    return;
  }

  test("belongsTo with explicit join strategy returns correct data", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    const post = await PostFactory.postWithBigint(sql, user.id, 1);

    const result = await sql
      .from(PostWithBigint)
      .where("id", post.id)
      .load("user", { strategy: "join" })
      .one();

    expect(result).toBeDefined();
    expect(result?.user).toBeDefined();
    expect(result?.user).not.toBeNull();
    expect((result?.user as any)?.id).toBe(user.id);
  });

  test("belongsTo with explicit batched strategy returns correct data", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    const post = await PostFactory.postWithBigint(sql, user.id, 1);

    const result = await sql
      .from(PostWithBigint)
      .where("id", post.id)
      .load("user", { strategy: "batched" })
      .one();

    expect(result).toBeDefined();
    expect(result?.user).toBeDefined();
    expect(result?.user).not.toBeNull();
    expect(result?.user?.id).toBe(user.id);
  });

  test("belongsTo join and batched produce equivalent results", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    await PostFactory.postWithBigint(sql, user.id, 3);

    const joinResult = await sql
      .from(PostWithBigint)
      .load("user", { strategy: "join" })
      .many();

    const batchedResult = await sql
      .from(PostWithBigint)
      .load("user", { strategy: "batched" })
      .many();

    expect(joinResult).toHaveLength(batchedResult.length);
    for (const joinPost of joinResult) {
      const batchedPost = batchedResult.find((p) => p.id === joinPost.id);
      expect(batchedPost).toBeDefined();
      expect((joinPost.user as any)?.id).toBe((batchedPost?.user as any)?.id);
    }
  });
});

describe(`[${env.DB_TYPE}] relation strategy integration - manyToMany`, () => {
  if (env.DB_TYPE === "cockroachdb") {
    test.skip("skipped on cockroachdb", () => {});
    return;
  }

  test("manyToMany with explicit join strategy returns correct data", async () => {
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
      .load("addresses", { strategy: "join" })
      .one();

    expect(result).toBeDefined();
    expect(result?.addresses).toHaveLength(3);
  });

  test("manyToMany with explicit batched strategy returns correct data", async () => {
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
      .load("addresses", { strategy: "batched" })
      .one();

    expect(result).toBeDefined();
    expect(result?.addresses).toHaveLength(3);
  });

  test("manyToMany with join returns empty array for no relations", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);

    const result = await sql
      .from(UserWithBigint)
      .where("id", user.id)
      .load("addresses", { strategy: "join" })
      .one();

    expect(result).toBeDefined();
    expect(result?.addresses).toHaveLength(0);
  });

  test("manyToMany join and batched produce equivalent results", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    const user2 = await UserFactory.userWithBigint(sql, 1);
    const addresses = await AddressFactory.addressWithBigint(sql, 4);

    for (const address of addresses) {
      await UserAddressFactory.userAddressWithBigint(
        sql,
        1,
        user.id,
        address.id,
      );
    }
    await UserAddressFactory.userAddressWithBigint(
      sql,
      1,
      user2.id,
      addresses[0].id,
    );

    const joinResult = await sql
      .from(UserWithBigint)
      .whereIn("id", [user.id, user2.id])
      .load("addresses", { strategy: "join" })
      .many();

    const batchedResult = await sql
      .from(UserWithBigint)
      .whereIn("id", [user.id, user2.id])
      .load("addresses", { strategy: "batched" })
      .many();

    expect(joinResult).toHaveLength(batchedResult.length);
    for (const joinUser of joinResult) {
      const batchedUser = batchedResult.find((u) => u.id === joinUser.id);
      expect(batchedUser).toBeDefined();
      expect(joinUser.addresses.length).toBe(batchedUser?.addresses.length);
    }
  });
});

// ─── Part 3: Load overload signatures ──────────────────────────────────────

describe(`[${env.DB_TYPE}] relation strategy - load overload signatures`, () => {
  if (env.DB_TYPE === "cockroachdb") {
    test.skip("skipped on cockroachdb", () => {});
    return;
  }

  test("load with query builder + options (overload 4)", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    const post1 = await PostFactory.postWithBigint(sql, user.id, 1);
    const post2 = await PostFactory.postWithBigint(sql, user.id, 1);
    const post3 = await PostFactory.postWithBigint(sql, user.id, 1);

    const result = await sql
      .from(UserWithBigint)
      .where("id", user.id)
      .load("posts", (qb) => qb.where("title", post1.title), {
        strategy: "batched",
      })
      .one();

    expect(result).toBeDefined();
    expect(result?.posts).toHaveLength(1);
    expect(result?.posts[0].title).toBe(post1.title);
  });

  test("load with options only (overload 3)", async () => {
    const users = await UserFactory.userWithBigint(sql, 3);
    for (const user of users) {
      await PostFactory.postWithBigint(sql, user.id, 1);
    }

    const result = await sql
      .from(UserWithBigint)
      .load("post", { strategy: "batched" })
      .many();

    expect(result).toHaveLength(3);
    for (const user of result) {
      expect(user.post).not.toBeNull();
    }
  });

  test("load with query builder and join strategy applies relation filter", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    const post1 = await PostFactory.postWithBigint(sql, user.id, 1);
    const post2 = await PostFactory.postWithBigint(sql, user.id, 1);
    const post3 = await PostFactory.postWithBigint(sql, user.id, 1);

    const result = await sql
      .from(UserWithBigint)
      .where("id", user.id)
      .load("posts", (qb) => qb.where("title", post1.title), {
        strategy: "join",
      })
      .one();

    expect(result).toBeDefined();
    expect(result?.posts).toHaveLength(1);
    expect(result?.posts[0].title).toBe(post1.title);
  });
});

// ─── Part 4: Auto strategy selection integration ───────────────────────────

describe(`[${env.DB_TYPE}] relation strategy - auto selection`, () => {
  if (env.DB_TYPE === "cockroachdb") {
    test.skip("skipped on cockroachdb", () => {});
    return;
  }

  test("auto selects join for single parent (.one()) and results are correct", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    await PostFactory.postWithBigint(sql, user.id, 3);

    const result = await sql
      .from(UserWithBigint)
      .where("id", user.id)
      .load("posts")
      .one();

    expect(result).toBeDefined();
    expect(result?.posts).toHaveLength(3);
    for (const post of result?.posts ?? []) {
      expect(post.userId).toBe(user.id);
    }
  });

  test("auto with many parents produces correct results", async () => {
    const users = await UserFactory.userWithBigint(sql, 15);
    for (const user of users) {
      await PostFactory.postWithBigint(sql, user.id, 2);
    }

    const result = await sql.from(UserWithBigint).load("posts").many();

    expect(result).toHaveLength(15);
    for (const user of result) {
      expect(user.posts).toHaveLength(2);
      for (const post of user.posts) {
        expect(post.userId).toBe(user.id);
      }
    }
  });
});

// ─── Part 5: Backward compatibility regression tests ───────────────────────

describe(`[${env.DB_TYPE}] relation strategy - backward compatibility`, () => {
  if (env.DB_TYPE === "cockroachdb") {
    test.skip("skipped on cockroachdb", () => {});
    return;
  }

  test("load('relation') without options works (overload 1)", async () => {
    const users = await UserFactory.userWithBigint(sql, 3);
    for (const user of users) {
      await PostFactory.postWithBigint(sql, user.id, 1);
    }

    const result = await sql.from(UserWithBigint).load("post").many();

    expect(result).toHaveLength(3);
    for (const user of result) {
      expect(user.id).toBe(user.post?.userId);
    }
  });

  test("load('relation', qb => ...) without options works (overload 2)", async () => {
    const user = await UserFactory.userWithBigint(sql, 1);
    const post1 = await PostFactory.postWithBigint(sql, user.id, 1);
    await PostFactory.postWithBigint(sql, user.id, 1);
    await PostFactory.postWithBigint(sql, user.id, 1);

    const result = await sql
      .from(UserWithBigint)
      .where("id", user.id)
      .load("posts", (qb) => qb.where("title", (post1 as any).title))
      .one();

    expect(result).toBeDefined();
    expect(result?.posts).toHaveLength(1);
    expect(result?.posts[0].title).toBe((post1 as any).title);
  });

  test("nested relations still work with new strategy dispatch", async () => {
    const users = await UserFactory.userWithBigint(sql, 3);
    for (const user of users) {
      await PostFactory.postWithBigint(sql, user.id, 1);
    }

    const result = await sql
      .from(UserWithBigint)
      .load("post", (qb) => qb.load("user"))
      .many();

    expect(result).toHaveLength(3);
    for (const user of result) {
      expect(user.id).toBe(user.post?.userId);
      expect((user.post as any)?.user?.id).toBe(user.id);
    }
  });

  test("multiple loads on same query work", async () => {
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

    expect(result).toBeDefined();
    expect(result?.posts).toHaveLength(2);
    expect(result?.addresses).toHaveLength(3);
  });
});
