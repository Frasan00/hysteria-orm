import crypto from "node:crypto";
import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserWithoutPk } from "../test_models/without_pk/user_without_pk";

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
  test("should select a post with exists", async () => {
    await SqlDataSource.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
    });

    const exists = await SqlDataSource.query("posts_with_uuid").exists();
    expect(exists).toBe(true);
  });

  test("should handle from with an alias", async () => {
    await SqlDataSource.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
    });

    const retrievedPost = await SqlDataSource.query("posts_with_uuid")
      .from("posts_with_uuid", "p")
      .where("p.title", "Hello World")
      .oneOrFail();

    expect(retrievedPost).toBeDefined();
    expect(retrievedPost.title).toBe("Hello World");
  });

  test("should handle from with a callback and an alias", async () => {
    await SqlDataSource.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
    });

    const retrievedPost = await SqlDataSource.query("posts_with_uuid")
      .from((qb) => {
        qb.select("title")
          .from("posts_with_uuid", "p")
          .where("p.title", "Hello World");
      }, "p")
      .oneOrFail();

    expect(retrievedPost).toBeDefined();
    expect(retrievedPost.title).toBe("Hello World");
  });

  test("should select a post", async () => {
    await SqlDataSource.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
    });

    const retrievedPost =
      await SqlDataSource.query("posts_with_uuid").oneOrFail();

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
      .oneOrFail();

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

    const count = await SqlDataSource.query("posts_with_uuid")
      // Should not affect the count query
      .groupBy("not_exists")
      .getCount();
    expect(count).toBe(2);
  });

  test("should create a post", async () => {
    await SqlDataSource.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
      content: "Hello World Content",
      short_description: "Hello World Short Description",
    });

    const retrievedPost =
      await SqlDataSource.query("posts_with_uuid").oneOrFail();

    expect(retrievedPost).toBeDefined();
    expect(retrievedPost.id).toBeDefined();
    expect(retrievedPost.title).toBe("Hello World");
  });

  test("should create multiple posts", async () => {
    await SqlDataSource.query("posts_with_uuid").insertMany([
      {
        id: crypto.randomUUID(),
        title: "Hello World",
      },
      {
        id: crypto.randomUUID(),
        title: "Hello World 2",
      },
      {
        id: crypto.randomUUID(),
        title: "Hello World 3",
      },
    ]);

    const posts = await SqlDataSource.query("posts_with_uuid")
      .orderBy("title", "asc")
      .many();

    expect(posts).toBeDefined();
    expect(posts.length).toBe(3);
    expect(posts[0].id).toBeDefined();
    expect(posts[1].id).toBeDefined();
    expect(posts[2].id).toBeDefined();
    expect(posts[0].title).toBe("Hello World");
    expect(posts[1].title).toBe("Hello World 2");
    expect(posts[2].title).toBe("Hello World 3");
  });

  test("should update a post", async () => {
    await SqlDataSource.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
    });

    await SqlDataSource.query("posts_with_uuid").update({
      title: "Hello World Updated",
    });

    const retrievedPost =
      await SqlDataSource.query("posts_with_uuid").firstOrFail();
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
      .oneOrFail();

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

    const retrievedUser =
      await SqlDataSource.query("users_without_pk").firstOrFail();

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

    const retrievedUser =
      await SqlDataSource.query("users_without_pk").firstOrFail();
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
    expect(retrievedUserWithDeletedAt?.deleted_at).toBeDefined();
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

describe(`[${env.DB_TYPE}] Where query builder tests`, () => {
  test("when does not enter the callback", async () => {
    await SqlDataSource.query("users_without_pk").insert({
      name: "John Doe",
    });

    const falseCondition = false;
    const users = await SqlDataSource.query("users_without_pk")
      .where("name", "TEST")
      .when(falseCondition, (qb) => qb.clearWhere().where("name", "John Doe"))
      .many();

    expect(users).toBeDefined();
    expect(users.length).toBe(0);
  });

  test("when enters the callback", async () => {
    await SqlDataSource.query("users_without_pk").insert({
      name: "John Doe",
    });

    const trueCondition = true;
    const users = await SqlDataSource.query("users_without_pk")
      .where("name", "TEST")
      .when(trueCondition, (qb) => qb.clearWhere().where("name", "John Doe"))
      .many();

    expect(users).toBeDefined();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("John Doe");
  });

  test("strict when does not enter the callback", async () => {
    await SqlDataSource.query("users_without_pk").insert({
      name: "John Doe",
    });

    const falseCondition = null;
    const users = await SqlDataSource.query("users_without_pk")
      .where("name", "TEST")
      .strictWhen(falseCondition, (qb) =>
        qb.clearWhere().where("name", "John Doe"),
      )
      .many();

    expect(users).toBeDefined();
    expect(users.length).toBe(0);
  });

  test("strict when enters the callback", async () => {
    await SqlDataSource.query("users_without_pk").insert({
      name: "John Doe",
    });

    const trueCondition = true;
    const users = await SqlDataSource.query("users_without_pk")
      .where("name", "TEST")
      .strictWhen(trueCondition, (qb) =>
        qb.clearWhere().where("name", "John Doe"),
      )
      .many();

    expect(users).toBeDefined();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("John Doe");
  });
});

describe(`[${env.DB_TYPE}] Where query builder (users_without_pk only)`, () => {
  beforeEach(async () => {
    await SqlDataSource.query("users_without_pk").insertMany([
      { name: "Alice" },
      { name: "Bob" },
      { name: "Charlie" },
      { name: null },
    ]);
  });

  afterEach(async () => {
    await SqlDataSource.query("users_without_pk").truncate();
  });

  test("whereIn returns correct users", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereIn("name", ["Alice", "Charlie"])
      .many();
    expect(users.length).toBe(2);
    expect(users.map((u) => u.name).sort()).toEqual(["Alice", "Charlie"]);
  });

  test("whereNotIn returns correct users", async () => {
    await SqlDataSource.query("users_without_pk").insert({
      name: "Bob",
    });

    const users = await SqlDataSource.query("users_without_pk")
      .whereNotIn("name", ["Alice", "Charlie"])
      .many();

    expect(users[0].name).toBe("Bob");
  });

  test("whereBetween returns no users (string col)", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereBetween("name", "A", "B")
      .many();
    expect(Array.isArray(users)).toBe(true);
  });

  test("whereNull returns correct users", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereNull("name")
      .many();
    expect(users.length).toBe(1);
    expect(users[0].name).toBeNull();
  });

  test("whereNotNull returns correct users", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereNotNull("name")
      .many();
    expect(users.length).toBe(3);
    expect(users.every((u) => u.name !== null)).toBe(true);
  });

  test("whereRegexp returns correct users", async () => {
    if (env.DB_TYPE === "sqlite") {
      return;
    }

    const users = await SqlDataSource.query("users_without_pk")
      .whereRegexp("name", /^A/)
      .many();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Alice");
  });

  test("whereRaw returns correct users", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereRaw("name = 'Bob'")
      .many();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Bob");
  });

  test("orWhere returns correct users", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .where("name", "Alice")
      .orWhere("name", "Bob")
      .many();
    expect(users.length).toBe(2);
    expect(users.map((u) => u.name).sort()).toEqual(["Alice", "Bob"]);
  });

  test("andWhere chaining returns correct users", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .where("name", "Alice")
      .andWhere("name", "Alice")
      .many();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Alice");
  });

  test("where with falsy/empty values", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .where("name", "")
      .many();
    expect(users.length).toBe(0);
  });

  test("whereIn with empty array returns no users", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereIn("name", [])
      .many();
    expect(users.length).toBe(0);
  });

  test("whereNotIn with empty array returns all users", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereNotIn("name", [])
      .many();

    expect(users.length).toBe(4);
  });
});

describe(`[${env.DB_TYPE}] Where query builder advanced tests (users_without_pk only)`, () => {
  beforeEach(async () => {
    await SqlDataSource.query("users_without_pk").insertMany([
      { name: "Alice" },
      { name: "Bob" },
      { name: "Charlie" },
      { name: null },
    ]);
  });

  test("whereIn empty combined with another where returns no users", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereIn("name", [])
      .where("name", "Alice")
      .many();
    expect(users.length).toBe(0);
  });

  test("whereNotIn empty combined with another where returns filtered users", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereNotIn("name", [])
      .where("name", "Alice")
      .many();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Alice");
  });

  test("nested whereBuilder with whereIn empty returns no users", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereBuilder((qb) => {
        qb.whereIn("name", []);
        qb.where("name", "Alice");
      })
      .many();
    expect(users.length).toBe(0);
  });

  test("nested whereBuilder with whereNotIn empty returns filtered users", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereBuilder((qb) => {
        qb.whereNotIn("name", []);
        qb.where("name", "Alice");
      })
      .many();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Alice");
  });

  test("deeply nested whereBuilder with whereIn empty returns no users", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereBuilder((qb) => {
        qb.where("name", "Alice");
        qb.whereBuilder((qb2) => {
          qb2.whereIn("name", []);
          qb2.where("name", "Bob");
        });
      })
      .many();
    expect(users.length).toBe(0);
  });

  test("deeply nested whereBuilder with whereNotIn empty and valid where returns filtered users", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereBuilder((qb) => {
        qb.where("name", "Alice");
        qb.whereBuilder((qb2) => {
          qb2.whereNotIn("name", []);
          qb2.where("name", "Alice");
        });
      })
      .many();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Alice");
  });

  test("whereBuilder with both whereIn and whereNotIn empty returns no users", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereBuilder((qb) => {
        qb.whereIn("name", []);
        qb.whereNotIn("name", []);
      })
      .many();
    expect(users.length).toBe(0);
  });

  test("whereBuilder with whereIn empty and orWhere with valid value returns Alice", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereBuilder((qb) => {
        qb.whereIn("name", []);
        qb.orWhere("name", "Alice");
      })
      .many();

    expect(users.length).toBe(1); // Alice
  });

  test("whereBuilder with whereIn empty and orWhere with valid value returns no users", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereBuilder((qb) => {
        qb.whereIn("name", []);
        qb.andWhere("name", "Alice");
      })
      .many();

    expect(users.length).toBe(0);
  });

  test("whereBuilder with whereNotIn empty and orWhere with valid value returns users matching orWhere", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereBuilder((qb) => {
        qb.whereNotIn("name", []);
      })
      .many();
    expect(users.length).toBe(4);
  });

  test("multiple nested whereBuilders with mixed empty and non-empty whereIn/whereNotIn", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereBuilder((qb) => {
        qb.whereBuilder((qb2) => {
          qb2.whereIn("name", []);
        });
        qb.whereBuilder((qb3) => {
          qb3.whereNotIn("name", []);
          qb3.where("name", "Bob");
        });
      })
      .many();
    // The first nested whereBuilder returns no users, so the whole AND returns no users
    expect(users.length).toBe(0);
  });

  test("orWhereBuilder with whereIn empty and whereNotIn empty returns all users", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .orWhereBuilder((qb) => {
        qb.whereIn("name", []);
      })
      .orWhereBuilder((qb) => {
        qb.whereNotIn("name", []);
      })
      .many();
    // whereIn([]) returns no users, but orWhere with whereNotIn([]) returns all users
    expect(users.length).toBe(4);
  });

  test("orWhereBuilder with whereIn empty and orWhere with valid value returns users matching orWhere", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .orWhereBuilder((qb) => {
        qb.whereIn("name", []);
      })
      .orWhere("name", "Alice")
      .many();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Alice");
  });

  test("whereBuilder with whereIn non-empty and whereNotIn empty returns filtered users", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereBuilder((qb) => {
        qb.whereIn("name", ["Alice", "Bob"]);
        qb.whereNotIn("name", []);
      })
      .many();
    expect(users.length).toBe(2);
    expect(users.map((u) => u.name).sort()).toEqual(["Alice", "Bob"]);
  });

  test("whereBuilder with whereIn empty and whereNotIn non-empty returns no users", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereBuilder((qb) => {
        qb.whereIn("name", []);
        qb.whereNotIn("name", ["Alice"]);
      })
      .many();
    expect(users.length).toBe(0);
  });

  test("whereSubQuery returns correct users", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereSubQuery("name", (qb) =>
        qb.select("name").from("users_without_pk").where("name", "Alice"),
      )
      .many();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Alice");
  });
});

describe(`[${env.DB_TYPE}] Query Builder: whereSubQuery + whereBuilder integration`, () => {
  beforeEach(async () => {
    await SqlDataSource.query("users_without_pk").insertMany([
      { name: "Alice", age: 25 },
      { name: "Bob", age: 30 },
      { name: "Charlie", age: 35 },
      { name: "David", age: 40 },
      { name: null, age: null },
    ]);
  });

  afterEach(async () => {
    await SqlDataSource.query("users_without_pk").truncate();
  });

  test("whereBuilder with whereSubQuery inside", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereBuilder((qb) => {
        qb.where("age", ">", 25);
        qb.whereSubQuery("name", (subQb) =>
          subQb.select("name").from("users_without_pk").where("age", ">", 30),
        );
      })
      .many();

    expect(users.length).toBeDefined();
  });

  test("whereSubQuery with whereBuilder inside subquery", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereSubQuery("name", (subQb) => {
        subQb.select("name").from("users_without_pk");
        subQb.whereBuilder((qb) => {
          qb.where("age", ">", 30);
          qb.orWhere("name", "Alice");
        });
      })
      .many();

    expect(users.length).toBeDefined();
  });

  test("whereBuilder with multiple whereSubQuery and orWhere", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereBuilder((qb) => {
        qb.orWhereSubQuery("name", (subQb) =>
          subQb.select("name").from("users_without_pk").where("age", "<", 30),
        );
      })
      .many();

    expect(users.length).toBeDefined();
  });

  test("deeply nested whereBuilder and whereSubQuery", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .whereBuilder((qb) => {
        qb.whereBuilder((qb2) => {
          qb2.whereSubQuery("age", ">", (subQb) =>
            subQb
              .select("age")
              .from("users_without_pk")
              .where("name", "Charlie"),
          );
        });
        qb.where("name", "David");
      })
      .many();

    expect(users.length).toBeDefined();
  });

  test("should select a user with a subquery", async () => {
    const retrievedUser = await SqlDataSource.query("users_without_pk")
      .select("name")
      .selectSubQuery((subq) => {
        subq
          .select("name")
          .from("users_without_pk")
          .where("name", "Alice")
          .limit(1);
      }, "user_name")
      .where("name", "Alice")
      .one();

    expect(retrievedUser).toBeDefined();
    expect(retrievedUser?.name).toBeDefined();
    expect(retrievedUser?.user_name).toBe("Alice");
  });
});

describe(`[${env.DB_TYPE}] with performance`, () => {
  beforeEach(async () => {
    await SqlDataSource.query("users_without_pk").insertMany([
      { name: "Alice", age: 25 },
      { name: "Bob", age: 30 },
      { name: "Charlie", age: 35 },
      { name: "David", age: 40 },
      { name: null, age: null },
    ]);
  });

  afterEach(async () => {
    await SqlDataSource.query("users_without_pk").truncate();
  });

  test("existsWithPerformance", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .where("name", "Alice")
      .existsWithPerformance();

    expect(users.data).toBe(true);
    expect(users.time).toBeDefined();
  });

  test("manyWithPerformance", async () => {
    const users =
      await SqlDataSource.query("users_without_pk").performance.many();

    expect(users.data).toBeDefined();
    expect(users.time).toBeDefined();
  });

  test("oneWithPerformance", async () => {
    const user = await SqlDataSource.query("users_without_pk")
      .where("name", "Alice")
      .performance.one();

    expect(user.data).toBeDefined();
    expect(user.time).toBeDefined();
  });

  test("oneOrFailWithPerformance", async () => {
    const user = await SqlDataSource.query("users_without_pk")
      .where("name", "Alice")
      .performance.oneOrFail();

    expect(user.data).toBeDefined();
    expect(user.time).toBeDefined();
  });

  test("oneOrFailWithPerformance with ModelQueryBuilder", async () => {
    const user = await UserWithoutPk.query().performance.oneOrFail();
    expect(user.data).toBeDefined();
    expect(user.time).toBeDefined();
  });

  test("oneOrFailWithPerformance with ModelQueryBuilder and custom return type", async () => {
    const user = await UserWithoutPk.query().performance.oneOrFail(
      {},
      "seconds",
    );

    expect(user.data).toBeDefined();
    expect(user.time).toBeDefined();
  });

  test("paginateWithPerformance", async () => {
    const users = await SqlDataSource.query(
      "users_without_pk",
    ).performance.paginate(1, 10);

    expect(users.data).toBeDefined();
    expect(users.time).toBeDefined();
  });

  test("paginateWithPerformance with ModelQueryBuilder", async () => {
    const users = await UserWithoutPk.query().performance.paginate(1, 10);
    expect(users.data).toBeDefined();
    expect(users.time).toBeDefined();
  });

  test("paginateWithPerformance with ModelQueryBuilder and custom return type", async () => {
    const users = await UserWithoutPk.query().performance.paginate(
      1,
      10,
      {},
      "seconds",
    );
    expect(users.data).toBeDefined();
    expect(users.time).toBeDefined();
  });
});

describe(`[${env.DB_TYPE}] Query Builder chunk method`, () => {
  beforeEach(async () => {
    await SqlDataSource.query("users_without_pk").insertMany([
      { name: "User 1", age: 21 },
      { name: "User 2", age: 22 },
      { name: "User 3", age: 23 },
      { name: "User 4", age: 24 },
      { name: "User 5", age: 25 },
      { name: "User 6", age: 26 },
      { name: "User 7", age: 27 },
    ]);
  });

  afterEach(async () => {
    await SqlDataSource.query("users_without_pk").truncate();
  });

  test("should properly iterate through chunks", async () => {
    const chunkSize = 3;
    const chunks: any[][] = [];

    for await (const chunk of SqlDataSource.query("users_without_pk")
      .orderBy("name", "asc")
      .chunk(chunkSize)) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBe(3);
    expect(chunks[0].length).toBe(3);
    expect(chunks[1].length).toBe(3);
    expect(chunks[2].length).toBe(1);

    expect(chunks[0][0].name).toBe("User 1");
    expect(chunks[1][0].name).toBe("User 4");
    expect(chunks[2][0].name).toBe("User 7");
  });

  test("should properly iterate through chunks with next", async () => {
    const chunkSize = 3;

    const chunksIterator = SqlDataSource.query("users_without_pk")
      .orderBy("name", "asc")
      .chunk(chunkSize);

    const firstChunk = await chunksIterator.next();
    const secondChunk = await chunksIterator.next();
    const thirdChunk = await chunksIterator.next();

    expect(firstChunk.value?.length).toBe(3);
    expect(secondChunk.value?.length).toBe(3);
    expect(thirdChunk.value?.length).toBe(1);

    expect(firstChunk.value?.[0].name).toBe("User 1");
    expect(secondChunk.value?.[0].name).toBe("User 4");
    expect(thirdChunk.value?.[0].name).toBe("User 7");
  });

  test("should properly iterate through chunks with model", async () => {
    const chunkSize = 3;
    const chunks = [];

    for await (const chunk of UserWithoutPk.query()
      .orderBy("name", "asc")
      .chunk(chunkSize)) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBe(3);
    expect(chunks[0].length).toBe(3);
    expect(chunks[1].length).toBe(3);
    expect(chunks[2].length).toBe(1);

    expect(chunks[0][0].name).toBe("User 1");
    expect(chunks[1][0].name).toBe("User 4");
    expect(chunks[2][0].name).toBe("User 7");
  });

  test("should properly iterate through chunks with next with model", async () => {
    const chunkSize = 3;

    const chunksIterator = UserWithoutPk.query()
      .orderBy("name", "asc")
      .chunk(chunkSize);

    const firstChunk = await chunksIterator.next();
    const secondChunk = await chunksIterator.next();
    const thirdChunk = await chunksIterator.next();

    expect(firstChunk.value?.length).toBe(3);
    expect(secondChunk.value?.length).toBe(3);
    expect(thirdChunk.value?.length).toBe(1);

    expect(firstChunk.value?.[0].name).toBe("User 1");
    expect(secondChunk.value?.[0].name).toBe("User 4");
    expect(thirdChunk.value?.[0].name).toBe("User 7");
  });
});

describe(`[${env.DB_TYPE}] Query Builder stream method`, () => {
  beforeEach(async () => {
    await SqlDataSource.query("users_without_pk").insertMany([
      { name: "User 1", age: 21 },
      { name: "User 2", age: 22 },
      { name: "User 3", age: 23 },
    ]);
  });

  afterEach(async () => {
    await SqlDataSource.query("users_without_pk").truncate();
  });

  test("should properly stream results with event listeners", async () => {
    const users: any[] = [];
    const stream = await SqlDataSource.query("users_without_pk")
      .orderBy("name", "asc")
      .stream();

    await new Promise<void>((resolve, reject) => {
      stream.on("data", (user) => {
        users.push(user);
      });

      stream.on("end", () => {
        resolve();
      });

      stream.on("error", (error) => {
        reject(error);
      });
    });

    expect(users.length).toBe(3);
    expect(users[0].name).toBe("User 1");
    expect(users[1].name).toBe("User 2");
    expect(users[2].name).toBe("User 3");
  });

  test("should properly stream results with async iteration", async () => {
    const users: any[] = [];
    const stream = await SqlDataSource.query("users_without_pk")
      .orderBy("name", "asc")
      .stream();

    for await (const user of stream) {
      users.push(user);
    }

    expect(users.length).toBe(3);
    expect(users[0].name).toBe("User 1");
    expect(users[1].name).toBe("User 2");
    expect(users[2].name).toBe("User 3");
  });
});

describe(`[${env.DB_TYPE}] Query Builder copy method`, () => {
  beforeEach(async () => {
    await SqlDataSource.query("users_without_pk").insertMany([
      { name: "User 1", age: 21 },
      { name: "User 2", age: 22 },
      { name: "User 3", age: 23 },
    ]);
  });

  afterEach(async () => {
    await SqlDataSource.query("users_without_pk").truncate();
  });

  test("should properly copy the query builder", async () => {
    const queryBuilder = SqlDataSource.query("users_without_pk")
      .select("name")
      .where("age", ">", 20)
      .andWhere("age", "<", 25)
      .join("posts", "posts.user_id", "users_without_pk.id")
      .groupBy("name")
      .having("name", "User 1")
      .orderBy("name", "asc")
      .offset(10)
      .unionAll(SqlDataSource.query("posts").select("name"))
      .with("posts", (qb) => qb.select("name").from("posts"))
      .lockForUpdate()
      .forShare()
      .withRecursive("posts", (qb) => qb.select("name").from("posts"))
      .limit(1);

    const copiedQueryBuilder = queryBuilder.copy();
    expect(copiedQueryBuilder).toBeDefined();
    expect(copiedQueryBuilder.toQuery()).toBe(queryBuilder.toQuery());
  });

  test("copy should not affect the original query builder", async () => {
    const queryBuilder = SqlDataSource.query("users_without_pk").select("name");
    const copiedQueryBuilder = queryBuilder.copy().limit(1);
    const users = await queryBuilder.many();
    const copiedUsers = await copiedQueryBuilder.many();

    expect(users.length).toBe(3);
    expect(copiedUsers.length).toBe(1);
  });
});

describe(`[${env.DB_TYPE}] Query Builder paginateWithCursor method`, () => {
  beforeEach(async () => {
    await SqlDataSource.query("users_without_pk").insertMany([
      { name: "User 1", age: 21 },
      { name: "User 2", age: 22 },
      { name: "User 3", age: 23 },
    ]);
  });

  afterEach(async () => {
    await SqlDataSource.query("users_without_pk").truncate();
  });

  test("should properly paginate results with cursor", async () => {
    const toBeChecked1 = env.DB_TYPE === "cockroachdb" ? "21" : 21;
    const [users, cursor] = await SqlDataSource.query("users_without_pk")
      .select("name", "age")
      .paginateWithCursor(1, { discriminator: "age" });
    expect(users.data.length).toBe(1);
    expect(cursor.key).toBe("age");
    expect(cursor.value).toBe(toBeChecked1);

    const toBeChecked2 = env.DB_TYPE === "cockroachdb" ? "22" : 22;
    const [users2, cursor2] = await SqlDataSource.query("users_without_pk")
      .select("name", "age")
      .paginateWithCursor(1, { discriminator: "age" }, cursor);
    expect(users2.data.length).toBe(1);
    expect(cursor2.key).toBe("age");
    expect(cursor2.value).toBe(toBeChecked2);

    const toBeChecked3 = env.DB_TYPE === "cockroachdb" ? "23" : 23;
    const [users3, cursor3] = await SqlDataSource.query("users_without_pk")
      .select("name", "age")
      .paginateWithCursor(1, { discriminator: "age" }, cursor2);
    expect(users3.data.length).toBe(1);
    expect(cursor3.key).toBe("age");
    expect(cursor3.value).toBe(toBeChecked3);
  });
});
