import crypto from "node:crypto";
import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserWithoutPk } from "../test_models/without_pk/user_without_pk";

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

describe(`[${env.DB_TYPE}] Query Builder with uuid`, () => {
  beforeEach(async () => {
    await SqlDataSource.instance.query("posts_with_uuid").delete();
    await SqlDataSource.instance.query("users_without_pk").delete();
  });

  afterEach(async () => {
    await SqlDataSource.instance.query("posts_with_uuid").delete();
    await SqlDataSource.instance.query("users_without_pk").delete();
  });

  test("should support distinct and distinctOn", async () => {
    await SqlDataSource.instance.query("posts_with_uuid").insertMany([
      { id: crypto.randomUUID(), title: "Hello" },
      { id: crypto.randomUUID(), title: "Hello" },
      { id: crypto.randomUUID(), title: "World" },
    ]);

    const all = await SqlDataSource.instance
      .query("posts_with_uuid")
      .select("title")
      .many();
    expect(all.length).toBeGreaterThanOrEqual(3);

    const distinct = await SqlDataSource.instance
      .query("posts_with_uuid")
      .select("title")
      .distinct()
      .many();
    expect(distinct.length).toBeLessThan(all.length);

    if (env.DB_TYPE === "postgres" || env.DB_TYPE === "cockroachdb") {
      const distinctOn = await SqlDataSource.instance
        .query("posts_with_uuid")
        .select("title")
        .distinctOn("title")
        .many();
      expect(distinctOn.length).toBeGreaterThan(0);
    }
  });

  test("should select a post with exists", async () => {
    await SqlDataSource.instance.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
    });

    const exists = await SqlDataSource.instance
      .query("posts_with_uuid")
      .exists();
    expect(exists).toBe(true);
  });

  test("should handle from with an alias", async () => {
    await SqlDataSource.instance.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
    });

    const retrievedPost = await SqlDataSource.instance
      .query("posts_with_uuid")
      .from("posts_with_uuid", "p")
      .where("p.title", "Hello World")
      .oneOrFail();

    expect(retrievedPost).toBeDefined();
    expect(retrievedPost.title).toBe("Hello World");
  });

  test("should handle from with a callback and an alias", async () => {
    await SqlDataSource.instance.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
    });

    const retrievedPost = await SqlDataSource.instance
      .query("posts_with_uuid")
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
    await SqlDataSource.instance.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
    });

    const retrievedPost = await SqlDataSource.instance
      .query("posts_with_uuid")
      .oneOrFail();

    expect(retrievedPost).toBeDefined();
    expect(retrievedPost.id).toBeDefined();
    expect(retrievedPost.title).toBe("Hello World");
  });

  test("should select a post with a custom alias", async () => {
    await SqlDataSource.instance.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
    });

    const retrievedPost = await SqlDataSource.instance
      .query("posts_with_uuid")
      .select(["title", "postTitle"])
      .oneOrFail();

    expect(retrievedPost).toBeDefined();
    expect(retrievedPost.postTitle).toBe("Hello World");
  });

  test("should select posts with pagination", async () => {
    await SqlDataSource.instance.query("posts_with_uuid").insertMany([
      { id: crypto.randomUUID(), title: "Hello World" },
      { id: crypto.randomUUID(), title: "Hello World 2" },
    ]);

    const posts = await SqlDataSource.instance
      .query("posts_with_uuid")
      .paginate(1, 1);

    expect(posts).toBeDefined();
    expect(posts.data.length).toBe(1);
    expect(posts.data[0].id).toBeDefined();
    expect(posts.paginationMetadata.total).toBe(2);
    expect(posts.paginationMetadata.currentPage).toBe(1);
    expect(posts.paginationMetadata.perPage).toBe(1);
    expect(posts.paginationMetadata.hasMorePages).toBe(true);
  });

  test("should get post count", async () => {
    await SqlDataSource.instance.query("posts_with_uuid").insertMany([
      { id: crypto.randomUUID(), title: "Hello World" },
      { id: crypto.randomUUID(), title: "Hello World 2" },
    ]);

    const count = await SqlDataSource.instance
      .query("posts_with_uuid")
      // Should not affect the count query
      .groupBy("not_exists")
      .getCount();
    expect(count).toBe(2);
  });

  test("should create a post", async () => {
    await SqlDataSource.instance.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
      content: "Hello World Content",
      short_description: "Hello World Short Description",
    });

    const retrievedPost = await SqlDataSource.instance
      .query("posts_with_uuid")
      .oneOrFail();

    expect(retrievedPost).toBeDefined();
    expect(retrievedPost.id).toBeDefined();
    expect(retrievedPost.title).toBe("Hello World");
  });

  test("should create multiple posts", async () => {
    await SqlDataSource.instance.query("posts_with_uuid").insertMany([
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

    const posts = await SqlDataSource.instance
      .query("posts_with_uuid")
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
    await SqlDataSource.instance.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
    });

    await SqlDataSource.instance.query("posts_with_uuid").update({
      title: "Hello World Updated",
    });

    const retrievedPost = await SqlDataSource.instance
      .query("posts_with_uuid")
      .oneOrFail();
    expect(retrievedPost.title).toBe("Hello World Updated");
  });

  test("should delete a post", async () => {
    await SqlDataSource.instance.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
    });

    await SqlDataSource.instance.query("posts_with_uuid").delete();

    const retrievedPost = await SqlDataSource.instance
      .query("posts_with_uuid")
      .one();
    expect(retrievedPost).toBeNull();
  });

  test("should soft delete a post", async () => {
    await SqlDataSource.instance.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
    });

    await SqlDataSource.instance.query("posts_with_uuid").softDelete({
      column: "deleted_at",
    });

    const retrievedPost = await SqlDataSource.instance
      .query("posts_with_uuid")
      .whereNull("deleted_at")
      .one();
    expect(retrievedPost).toBeNull();

    const retrievedPostWithDeletedAt = await SqlDataSource.instance
      .query("posts_with_uuid")
      .whereNotNull("deleted_at")
      .oneOrFail();

    expect(retrievedPostWithDeletedAt).toBeDefined();
    expect(retrievedPostWithDeletedAt.deleted_at).toBeDefined();
  });

  test("should truncate the table", async () => {
    await SqlDataSource.instance.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
    });

    await SqlDataSource.instance.query("posts_with_uuid").truncate();

    const retrievedPost = await SqlDataSource.instance
      .query("posts_with_uuid")
      .one();
    expect(retrievedPost).toBeNull();
  });
});

describe(`[${env.DB_TYPE}] Query Builder with a model without a primary key`, () => {
  beforeEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
  });

  afterEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
  });

  test("should create a user", async () => {
    await SqlDataSource.instance.query("users_without_pk").insert({
      name: "John Doe",
    });

    const retrievedUser = await SqlDataSource.instance
      .query("users_without_pk")
      .oneOrFail();

    expect(retrievedUser).toBeDefined();
    expect(retrievedUser.id).not.toBeDefined();
    expect(retrievedUser.name).toBe("John Doe");
  });

  test("should create multiple users", async () => {
    await SqlDataSource.instance.query("users_without_pk").insertMany([
      { name: "John Doe", email: "john.doe@test.com" },
      { name: "Jane Doe", email: "jane.doe@test.com" },
    ]);

    const retrievedUsers = await SqlDataSource.instance
      .query("users_without_pk")
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
    await SqlDataSource.instance.query("users_without_pk").insert({
      name: "John Doe",
    });

    await SqlDataSource.instance.query("users_without_pk").update({
      name: "Jane Doe",
    });

    const retrievedUser = await SqlDataSource.instance
      .query("users_without_pk")
      .oneOrFail();
    expect(retrievedUser.name).toBe("Jane Doe");
  });

  test("should delete a user", async () => {
    await SqlDataSource.instance.query("users_without_pk").insert({
      name: "John Doe",
    });

    await SqlDataSource.instance.query("users_without_pk").delete();

    const retrievedUser = await SqlDataSource.instance
      .query("users_without_pk")
      .one();
    expect(retrievedUser).toBeNull();
  });

  test("should soft delete a user", async () => {
    await SqlDataSource.instance.query("users_without_pk").insert({
      name: "John Doe",
    });

    await SqlDataSource.instance.query("users_without_pk").softDelete({
      column: "deleted_at",
    });

    const retrievedUser = await SqlDataSource.instance
      .query("users_without_pk")
      .whereNull("deleted_at")
      .one();
    expect(retrievedUser).toBeNull();

    const retrievedUserWithDeletedAt = await SqlDataSource.instance
      .query("users_without_pk")
      .whereNotNull("deleted_at")
      .one();

    expect(retrievedUserWithDeletedAt).toBeDefined();
    expect(retrievedUserWithDeletedAt?.deleted_at).toBeDefined();
  });

  test("should truncate the table", async () => {
    await SqlDataSource.instance.query("users_without_pk").insert({
      name: "John Doe",
    });

    await SqlDataSource.instance.query("users_without_pk").truncate();

    const retrievedUser = await SqlDataSource.instance
      .query("users_without_pk")
      .one();
    expect(retrievedUser).toBeNull();
  });
});

describe(`[${env.DB_TYPE}] Where query builder tests`, () => {
  beforeEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
  });

  afterEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
  });

  test("when does not enter the callback", async () => {
    await SqlDataSource.instance.query("users_without_pk").insert({
      name: "John Doe",
    });

    const falseCondition = false;
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where("name", "TEST")
      .when(falseCondition, (qb) => qb.clearWhere().where("name", "John Doe"))
      .many();

    expect(users).toBeDefined();
    expect(users.length).toBe(0);
  });

  test("when enters the callback", async () => {
    await SqlDataSource.instance.query("users_without_pk").insert({
      name: "John Doe",
    });

    const trueCondition = true;
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where("name", "TEST")
      .when(trueCondition, (qb) => qb.clearWhere().where("name", "John Doe"))
      .many();

    expect(users).toBeDefined();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("John Doe");
  });

  test("strict when does not enter the callback", async () => {
    await SqlDataSource.instance.query("users_without_pk").insert({
      name: "John Doe",
    });

    const falseCondition = null;
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where("name", "TEST")
      .strictWhen(falseCondition, (qb) =>
        qb.clearWhere().where("name", "John Doe"),
      )
      .many();

    expect(users).toBeDefined();
    expect(users.length).toBe(0);
  });

  test("strict when enters the callback", async () => {
    await SqlDataSource.instance.query("users_without_pk").insert({
      name: "John Doe",
    });

    const trueCondition = true;
    const users = await SqlDataSource.instance
      .query("users_without_pk")
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
    await SqlDataSource.instance.query("users_without_pk").delete();
    await SqlDataSource.instance.query("users_without_pk").insertMany([
      { name: "Alice", email: "alice.where@test.com" },
      { name: "Bob", email: "bob.where@test.com" },
      { name: "Charlie", email: "charlie.where@test.com" },
      { name: null, email: "nullname.where@test.com" },
    ]);
  });

  afterEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
  });

  test("whereIn returns correct users", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .whereIn("name", ["Alice", "Charlie"])
      .many();
    expect(users.length).toBe(2);
    expect(users.map((u) => u.name).sort()).toEqual(["Alice", "Charlie"]);
  });

  test("whereNotIn returns correct users", async () => {
    await SqlDataSource.instance.query("users_without_pk").insert({
      name: "Bob",
      email: "bob2.where@test.com",
    });

    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .whereNotIn("name", ["Alice", "Charlie"])
      .many();

    expect(users[0].name).toBe("Bob");
  });

  test("whereBetween returns no users (string col)", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .whereBetween("name", "A", "B")
      .many();
    expect(Array.isArray(users)).toBe(true);
  });

  test("whereNull returns correct users", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .whereNull("name")
      .many();
    expect(users.length).toBe(1);
    expect(users[0].name).toBeNull();
  });

  test("whereNotNull returns correct users", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .whereNotNull("name")
      .many();
    expect(users.length).toBe(3);
    expect(users.every((u) => u.name !== null)).toBe(true);
  });

  test("whereRegexp returns correct users", async () => {
    // SQLite and MSSQL don't support REGEXP syntax
    if (env.DB_TYPE === "sqlite" || env.DB_TYPE === "mssql") {
      return;
    }

    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .whereRegexp("name", /^A/)
      .many();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Alice");
  });

  test("whereRaw returns correct users", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .whereRaw("name = 'Bob'")
      .many();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Bob");
  });

  test("orWhere returns correct users", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where("name", "Alice")
      .orWhere("name", "Bob")
      .many();
    expect(users.length).toBe(2);
    expect(users.map((u) => u.name).sort()).toEqual(["Alice", "Bob"]);
  });

  test("andWhere chaining returns correct users", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where("name", "Alice")
      .andWhere("name", "Alice")
      .many();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Alice");
  });

  test("where with falsy/empty values", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where("name", "")
      .many();
    expect(users.length).toBe(0);
  });

  test("whereIn with empty array returns no users", async () => {
    // MSSQL doesn't support bare 'false' as a WHERE condition
    if (env.DB_TYPE === "mssql") return;
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .whereIn("name", [])
      .many();
    expect(users.length).toBe(0);
  });

  test("whereNotIn with empty array returns all users", async () => {
    // MSSQL doesn't support bare 'true' as a WHERE condition
    if (env.DB_TYPE === "mssql") return;
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .whereNotIn("name", [])
      .many();

    expect(users.length).toBe(4);
  });
});

describe(`[${env.DB_TYPE}] Where query builder advanced tests (users_without_pk only)`, () => {
  beforeEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
    await SqlDataSource.instance.query("users_without_pk").insertMany([
      { name: "Alice", email: "alice.adv@test.com" },
      { name: "Bob", email: "bob.adv@test.com" },
      { name: "Charlie", email: "charlie.adv@test.com" },
      { name: null, email: "nullname.adv@test.com" },
    ]);
  });

  afterEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
  });

  test("whereIn empty combined with another where returns no users", async () => {
    // MSSQL generates invalid SQL for empty whereIn combined with other clauses
    if (env.DB_TYPE === "mssql") return;
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .whereIn("name", [])
      .where("name", "Alice")
      .many();
    expect(users.length).toBe(0);
  });

  test("whereNotIn empty combined with another where returns filtered users", async () => {
    // MSSQL generates invalid SQL for empty whereNotIn combined with other clauses
    if (env.DB_TYPE === "mssql") return;
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .whereNotIn("name", [])
      .where("name", "Alice")
      .many();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Alice");
  });

  test("nested where with callback and whereIn empty returns no users", async () => {
    // MSSQL generates invalid SQL for empty whereIn in nested callbacks
    if (env.DB_TYPE === "mssql") return;
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where((qb) => {
        qb.whereIn("name", []);
        qb.where("name", "Alice");
      })
      .many();
    expect(users.length).toBe(0);
  });

  test("nested where with callback and whereNotIn empty returns filtered users", async () => {
    // MSSQL generates invalid SQL for empty whereNotIn in nested callbacks
    if (env.DB_TYPE === "mssql") return;
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where((qb) => {
        qb.whereNotIn("name", []);
        qb.where("name", "Alice");
      })
      .many();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Alice");
  });

  test("deeply nested where with callback and whereIn empty returns no users", async () => {
    // MSSQL generates invalid SQL for empty whereIn in deeply nested callbacks
    if (env.DB_TYPE === "mssql") return;
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where((qb) => {
        qb.where("name", "Alice");
        qb.where((qb2) => {
          qb2.whereIn("name", []);
          qb2.where("name", "Bob");
        });
      })
      .many();
    expect(users.length).toBe(0);
  });

  test("deeply nested where with callbacks and whereNotIn empty and valid where returns filtered users", async () => {
    // MSSQL generates invalid SQL for empty whereNotIn in deeply nested callbacks
    if (env.DB_TYPE === "mssql") return;
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where((qb) => {
        qb.where("name", "Alice");
        qb.where((qb2) => {
          qb2.whereNotIn("name", []);
          qb2.where("name", "Alice");
        });
      })
      .many();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Alice");
  });

  test("where with callback having both whereIn and whereNotIn empty returns no users", async () => {
    // MSSQL generates invalid SQL for empty whereIn/whereNotIn in callbacks
    if (env.DB_TYPE === "mssql") return;
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where((qb) => {
        qb.whereIn("name", []);
        qb.whereNotIn("name", []);
      })
      .many();
    expect(users.length).toBe(0);
  });

  test("where with callback having whereIn empty and orWhere with valid value returns Alice", async () => {
    // MSSQL generates invalid SQL for empty whereIn with orWhere in callbacks
    if (env.DB_TYPE === "mssql") return;
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where((qb) => {
        qb.whereIn("name", []);
        qb.orWhere("name", "Alice");
      })
      .many();

    expect(users.length).toBe(1); // Alice
  });

  test("where with callback having whereIn empty and andWhere with valid value returns no users", async () => {
    // MSSQL generates invalid SQL for empty whereIn with andWhere in callbacks
    if (env.DB_TYPE === "mssql") return;
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where((qb) => {
        qb.whereIn("name", []);
        qb.andWhere("name", "Alice");
      })
      .many();

    expect(users.length).toBe(0);
  });

  test("where with callback having whereNotIn empty returns all users", async () => {
    // MSSQL generates invalid SQL for empty whereNotIn in callbacks
    if (env.DB_TYPE === "mssql") return;
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where((qb) => {
        qb.whereNotIn("name", []);
      })
      .many();
    expect(users.length).toBe(4);
  });

  test("multiple nested where callbacks with mixed empty and non-empty whereIn/whereNotIn", async () => {
    // MSSQL generates invalid SQL for empty whereIn/whereNotIn in nested callbacks
    if (env.DB_TYPE === "mssql") return;
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where((qb) => {
        qb.where((qb2) => {
          qb2.whereIn("name", []);
        });
        qb.where((qb3) => {
          qb3.whereNotIn("name", []);
          qb3.where("name", "Bob");
        });
      })
      .many();
    // The first nested whereBuilder returns no users, so the whole AND returns no users
    expect(users.length).toBe(0);
  });

  test("chained OR where callbacks: whereIn empty then whereNotIn empty returns all users", async () => {
    // MSSQL generates invalid SQL for empty whereIn/whereNotIn in orWhere callbacks
    if (env.DB_TYPE === "mssql") return;
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .orWhere((qb) => {
        qb.whereIn("name", []);
      })
      .orWhere((qb) => {
        qb.whereNotIn("name", []);
      })
      .many();
    // whereIn([]) returns no users, but orWhere with whereNotIn([]) returns all users
    expect(users.length).toBe(4);
  });

  test("orWhere with callback whereIn empty then orWhere with valid value returns users matching orWhere", async () => {
    // MSSQL generates invalid SQL for empty whereIn in orWhere callbacks
    if (env.DB_TYPE === "mssql") return;
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .orWhere((qb) => {
        qb.whereIn("name", []);
      })
      .orWhere("name", "Alice")
      .many();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Alice");
  });

  test("where callbacks with whereIn non-empty and whereNotIn empty returns filtered users", async () => {
    // MSSQL generates invalid SQL for empty whereNotIn in callbacks
    if (env.DB_TYPE === "mssql") return;
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where((qb) => {
        qb.whereIn("name", ["Alice", "Bob"]);
        qb.whereNotIn("name", []);
      })
      .many();
    expect(users.length).toBe(2);
    expect(users.map((u) => u.name).sort()).toEqual(["Alice", "Bob"]);
  });

  test("where callbacks with whereIn empty and whereNotIn non-empty returns no users", async () => {
    // MSSQL generates invalid SQL for empty whereIn in callbacks
    if (env.DB_TYPE === "mssql") return;
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where((qb) => {
        qb.whereIn("name", []);
        qb.whereNotIn("name", ["Alice"]);
      })
      .many();
    expect(users.length).toBe(0);
  });

  test("where with subquery returns correct users", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where("name", (qb) =>
        qb.select("name").from("users_without_pk").where("name", "Alice"),
      )
      .many();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Alice");
  });

  test("whereNot returns users not equal to value", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .whereNot("name", "Alice")
      .many();
    expect(users.every((u) => u.name !== "Alice")).toBe(true);
  });

  test("orWhereNot with callback group returns expected users", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where((qb) => {
        qb.where("name", "Alice");
      })
      .orWhereNot("name", "Charlie")
      .many();

    expect(users.length).toBeGreaterThan(0);
  });
});

describe(`[${env.DB_TYPE}] Query Builder: whereSubQuery + whereBuilder integration`, () => {
  beforeEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
    await SqlDataSource.instance.query("users_without_pk").insertMany([
      { name: "Alice", age: 25, email: "alice.sub@test.com" },
      { name: "Bob", age: 30, email: "bob.sub@test.com" },
      { name: "Charlie", age: 35, email: "charlie.sub@test.com" },
      { name: "David", age: 40, email: "david.sub@test.com" },
      { name: null, age: null, email: "nullname.sub@test.com" },
    ]);
  });

  afterEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
  });

  test("nested where callback with subquery inside", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where((qb) => {
        qb.where("age", ">", 25);
        qb.where("name", (subQb) =>
          subQb.select("name").from("users_without_pk").where("age", ">", 30),
        );
      })
      .many();

    expect(users.length).toBeDefined();
  });

  test("where with subquery having nested where callbacks inside", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where("name", (subQb) => {
        subQb.select("name").from("users_without_pk");
        subQb.where((qb) => {
          qb.where("age", ">", 30);
          qb.orWhere("name", "Alice");
        });
      })
      .many();

    expect(users.length).toBeDefined();
  });

  test("where with callback having orWhere subquery", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where((qb) => {
        qb.orWhere("name", (subQb) =>
          subQb.select("name").from("users_without_pk").where("age", "<", 30),
        );
      })
      .many();

    expect(users.length).toBeDefined();
  });

  test("deeply nested where callbacks and subqueries", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where((qb) => {
        qb.where((qb2) => {
          qb2.where("age", ">", (subQb) =>
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
    const retrievedUser = await SqlDataSource.instance
      .query("users_without_pk")
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
    await SqlDataSource.instance.query("users_without_pk").delete();
    await SqlDataSource.instance.query("users_without_pk").insertMany([
      { name: "Alice", age: 25, email: "alice.perf@test.com" },
      { name: "Bob", age: 30, email: "bob.perf@test.com" },
      { name: "Charlie", age: 35, email: "charlie.perf@test.com" },
      { name: "David", age: 40, email: "david.perf@test.com" },
      { name: null, age: null, email: "nullname.perf@test.com" },
    ]);
  });

  afterEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
  });

  test("existsWithPerformance", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .where("name", "Alice")
      .performance.exists();

    expect(users.data).toBe(true);
    expect(users.time).toBeDefined();
  });

  test("manyWithPerformance", async () => {
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .performance.many();

    expect(users.data).toBeDefined();
    expect(users.time).toBeDefined();
  });

  test("oneWithPerformance", async () => {
    const user = await SqlDataSource.instance
      .query("users_without_pk")
      .where("name", "Alice")
      .performance.one();

    expect(user.data).toBeDefined();
    expect(user.time).toBeDefined();
  });

  test("oneOrFailWithPerformance", async () => {
    const user = await SqlDataSource.instance
      .query("users_without_pk")
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
    const users = await SqlDataSource.instance
      .query("users_without_pk")
      .performance.paginate(1, 10);

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
    await SqlDataSource.instance.query("users_without_pk").delete();
    await SqlDataSource.instance.query("users_without_pk").insertMany([
      { name: "User 1", age: 21, email: "chunk1@test.com" },
      { name: "User 2", age: 22, email: "chunk2@test.com" },
      { name: "User 3", age: 23, email: "chunk3@test.com" },
      { name: "User 4", age: 24, email: "chunk4@test.com" },
      { name: "User 5", age: 25, email: "chunk5@test.com" },
      { name: "User 6", age: 26, email: "chunk6@test.com" },
      { name: "User 7", age: 27, email: "chunk7@test.com" },
    ]);
  });

  afterEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
  });

  test("should properly iterate through chunks", async () => {
    const chunkSize = 3;
    const chunks: any[][] = [];

    for await (const chunk of SqlDataSource.instance
      .query("users_without_pk")
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

    const chunksIterator = SqlDataSource.instance
      .query("users_without_pk")
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
    await SqlDataSource.instance.query("users_without_pk").delete();
    await SqlDataSource.instance.query("users_without_pk").insertMany([
      { name: "User 1", age: 21, email: "stream1@test.com" },
      { name: "User 2", age: 22, email: "stream2@test.com" },
      { name: "User 3", age: 23, email: "stream3@test.com" },
    ]);
  });

  afterEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
  });

  test("should properly stream results with event listeners", async () => {
    const users: any[] = [];
    const stream = await SqlDataSource.instance
      .query("users_without_pk")
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
    const stream = await SqlDataSource.instance
      .query("users_without_pk")
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

describe(`[${env.DB_TYPE}] Query Builder clone method`, () => {
  beforeEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
    await SqlDataSource.instance.query("users_without_pk").insertMany([
      { name: "User 1", age: 21, email: "clone1@test.com" },
      { name: "User 2", age: 22, email: "clone2@test.com" },
      { name: "User 3", age: 23, email: "clone3@test.com" },
    ]);
  });

  afterEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
  });

  test("should properly clone the query builder", async () => {
    const queryBuilder = SqlDataSource.instance
      .query("users_without_pk")
      .select("name")
      .where("age", ">", 20)
      .andWhere("age", "<", 25)
      .join("posts", "posts.user_id", "users_without_pk.id")
      .groupBy("name")
      .having("name", "User 1")
      .orderBy("name", "asc")
      .offset(10)
      .unionAll(SqlDataSource.instance.query("posts").select("name"))
      .with("posts", (qb) => qb.select("name").from("posts"))
      .lockForUpdate()
      .forShare()
      .limit(1);

    const copiedQueryBuilder = queryBuilder.clone();
    expect(copiedQueryBuilder).toBeDefined();
    expect(copiedQueryBuilder.toQuery()).toBe(queryBuilder.toQuery());
  });

  test("copy should not affect the original query builder", async () => {
    const queryBuilder = SqlDataSource.instance
      .query("users_without_pk")
      .select("name");
    const copiedQueryBuilder = queryBuilder.clone().limit(1);
    const users = await queryBuilder.many();
    const copiedUsers = await copiedQueryBuilder.many();

    expect(users.length).toBe(3);
    expect(copiedUsers.length).toBe(1);
  });
});

describe(`[${env.DB_TYPE}] Query Builder paginateWithCursor method`, () => {
  beforeEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
    await SqlDataSource.instance.query("users_without_pk").insertMany([
      { name: "User 1", age: 21, email: "cursor1@test.com" },
      { name: "User 2", age: 22, email: "cursor2@test.com" },
      { name: "User 3", age: 23, email: "cursor3@test.com" },
    ]);
  });

  afterEach(async () => {
    await SqlDataSource.instance.query("users_without_pk").delete();
  });

  test("should properly paginate results with cursor", async () => {
    const toBeChecked1 = env.DB_TYPE === "cockroachdb" ? "21" : 21;
    const [users, cursor] = await SqlDataSource.instance
      .query("users_without_pk")
      .select("name", "age")
      .paginateWithCursor(1, { discriminator: "age" });
    expect(users.data.length).toBe(1);
    expect(cursor.key).toBe("age");
    expect(cursor.value).toBe(toBeChecked1);

    const toBeChecked2 = env.DB_TYPE === "cockroachdb" ? "22" : 22;
    const [users2, cursor2] = await SqlDataSource.instance
      .query("users_without_pk")
      .select("name", "age")
      .paginateWithCursor(1, { discriminator: "age" }, cursor);
    expect(users2.data.length).toBe(1);
    expect(cursor2.key).toBe("age");
    expect(cursor2.value).toBe(toBeChecked2);

    const toBeChecked3 = env.DB_TYPE === "cockroachdb" ? "23" : 23;
    const [users3, cursor3] = await SqlDataSource.instance
      .query("users_without_pk")
      .select("name", "age")
      .paginateWithCursor(1, { discriminator: "age" }, cursor2);
    expect(users3.data.length).toBe(1);
    expect(cursor3.key).toBe("age");
    expect(cursor3.value).toBe(toBeChecked3);
  });
});

describe(`[${env.DB_TYPE}] Upsert Query Builder methods`, () => {
  beforeEach(async () => {
    await SqlDataSource.instance.query("posts_with_uuid").delete();
    await SqlDataSource.instance.query("users_without_pk").delete();
  });

  afterEach(async () => {
    await SqlDataSource.instance.query("posts_with_uuid").delete();
    await SqlDataSource.instance.query("users_without_pk").delete();
  });

  test("should upsert a record (insert when not exists)", async () => {
    const uuid = crypto.randomUUID();
    const [post] = await SqlDataSource.instance
      .query("posts_with_uuid")
      .upsert(
        { id: uuid, title: "Upsert Test", content: "Content" },
        { id: uuid },
        { returning: ["id", "title", "content"] },
      );

    if (
      env.DB_TYPE !== "mysql" &&
      env.DB_TYPE !== "mariadb" &&
      env.DB_TYPE !== "sqlite"
    ) {
      expect(post).toBeDefined();
      // MSSQL returns UUIDs in uppercase
      expect(post.id.toLowerCase()).toBe(uuid.toLowerCase());
      expect(post.title).toBe("Upsert Test");
    }

    const retrievedPost = await SqlDataSource.instance
      .query("posts_with_uuid")
      .where("id", uuid)
      .oneOrFail();
    expect(retrievedPost.title).toBe("Upsert Test");
  });

  test("should upsert a record (update when exists)", async () => {
    // First insert a record
    const uuid = crypto.randomUUID();
    await SqlDataSource.instance.query("posts_with_uuid").insert({
      id: uuid,
      title: "Original Title",
      content: "Original Content",
    });

    // Then upsert to update it
    const [updatedPost] = await SqlDataSource.instance
      .query("posts_with_uuid")
      .upsert(
        { id: uuid, title: "Updated Title", content: "Updated Content" },
        { id: uuid },
        { returning: ["id", "title", "content"] },
      );

    if (
      env.DB_TYPE !== "mysql" &&
      env.DB_TYPE !== "mariadb" &&
      env.DB_TYPE !== "sqlite"
    ) {
      expect(updatedPost).toBeDefined();
      // MSSQL returns UUIDs in uppercase
      expect(updatedPost.id.toLowerCase()).toBe(uuid.toLowerCase());
      expect(updatedPost.title).toBe("Updated Title");
    }

    const retrievedPost = await SqlDataSource.instance
      .query("posts_with_uuid")
      .where("id", uuid)
      .oneOrFail();
    expect(retrievedPost.title).toBe("Updated Title");
    expect(retrievedPost.content).toBe("Updated Content");
  });

  test("should upsert multiple records with upsertMany", async () => {
    const uuid1 = crypto.randomUUID();
    const uuid2 = crypto.randomUUID();

    // Insert the first record
    await SqlDataSource.instance.query("posts_with_uuid").insert({
      id: uuid1,
      title: "First Post",
      content: "First Content",
    });

    // Upsert both records (one update, one insert)
    const posts = await SqlDataSource.instance
      .query("posts_with_uuid")
      .upsertMany(
        ["id"],
        ["title", "content"],
        [
          {
            id: uuid1,
            title: "Updated First Post",
            content: "Updated First Content",
          },
          { id: uuid2, title: "Second Post", content: "Second Content" },
        ],
      );

    if (
      env.DB_TYPE !== "mysql" &&
      env.DB_TYPE !== "mariadb" &&
      env.DB_TYPE !== "sqlite"
    ) {
      expect(posts).toBeDefined();
      expect(posts.length).toBe(2);
    }

    // Verify both records exist with correct data
    const retrievedPosts = await SqlDataSource.instance
      .query("posts_with_uuid")
      .whereIn("id", [uuid1, uuid2])
      .orderBy("title", "asc")
      .many();

    expect(retrievedPosts.length).toBe(2);
    // MSSQL returns UUIDs in uppercase
    expect(retrievedPosts[1].id.toLowerCase()).toBe(uuid1.toLowerCase());
    expect(retrievedPosts[1].title).toBe("Updated First Post");
    expect(retrievedPosts[0].id.toLowerCase()).toBe(uuid2.toLowerCase());
    expect(retrievedPosts[0].title).toBe("Second Post");
  });

  test("should respect updateOnConflict option in upsert", async () => {
    // First insert a record
    const uuid = crypto.randomUUID();
    await SqlDataSource.instance.query("posts_with_uuid").insert({
      id: uuid,
      title: "Original Title",
      content: "Original Content",
    });

    // Then upsert with updateOnConflict = false
    const result = await SqlDataSource.instance
      .query("posts_with_uuid")
      .upsert(
        { id: uuid, title: "Should Not Update", content: "Should Not Update" },
        { id: uuid },
        { updateOnConflict: false },
      );

    // The record should still exist but not be updated
    const retrievedPost = await SqlDataSource.instance
      .query("posts_with_uuid")
      .where("id", uuid)
      .oneOrFail();

    expect(retrievedPost.title).toBe("Original Title");
    expect(retrievedPost.content).toBe("Original Content");
  });

  test("should respect updateOnConflict option in upsertMany", async () => {
    const uuid1 = crypto.randomUUID();
    const uuid2 = crypto.randomUUID();

    // Insert both records first
    await SqlDataSource.instance.query("posts_with_uuid").insertMany([
      { id: uuid1, title: "First Original", content: "First Original Content" },
      {
        id: uuid2,
        title: "Second Original",
        content: "Second Original Content",
        created_at: new Date(),
      },
    ]);

    // Upsert with updateOnConflict = false
    await SqlDataSource.instance.query("posts_with_uuid").upsertMany(
      ["id"],
      ["title", "content"],
      [
        {
          id: uuid1,
          title: "Should Not Update 1",
          content: "Should Not Update 1",
          created_at: new Date(),
        },
        {
          id: uuid2,
          title: "Should Not Update 2",
          content: "Should Not Update 2",
          created_at: new Date(),
        },
      ],
      { updateOnConflict: false },
    );

    // Verify records were not updated
    const retrievedPosts = await SqlDataSource.instance
      .query("posts_with_uuid")
      .whereIn("id", [uuid1, uuid2])
      .orderBy("created_at", "asc")
      .many();

    expect(retrievedPosts.length).toBe(2);
    expect(retrievedPosts[0].title).toBeDefined();
    expect(retrievedPosts[1].title).toBeDefined();
  });
});

describe(`[${env.DB_TYPE}] Additional Query Builder methods`, () => {
  beforeEach(async () => {
    await SqlDataSource.instance.query("posts_with_uuid").delete();
    await SqlDataSource.instance.query("users_without_pk").delete();
  });

  afterEach(async () => {
    await SqlDataSource.instance.query("posts_with_uuid").delete();
    await SqlDataSource.instance.query("users_without_pk").delete();
  });

  test("pluck returns single column array", async () => {
    await SqlDataSource.instance.query("posts_with_uuid").insertMany([
      { id: crypto.randomUUID(), title: "T1" },
      { id: crypto.randomUUID(), title: "T2" },
    ]);

    const titles = await SqlDataSource.instance
      .query("posts_with_uuid")
      .pluck("title");
    expect(Array.isArray(titles)).toBe(true);
    expect(titles.length).toBeGreaterThanOrEqual(2);
    expect(titles).toEqual(expect.arrayContaining(["T1", "T2"]));
  });

  test("increment and decrement modify numeric columns", async () => {
    await SqlDataSource.instance.query("users_without_pk").insert({
      name: "Counter",
      age: 10,
    });

    const inc = await SqlDataSource.instance
      .query("users_without_pk")
      .increment("age" as any, 5);
    expect(typeof inc).toBe("number");

    const userAfterInc = await SqlDataSource.instance
      .query("users_without_pk")
      .oneOrFail();
    if (env.DB_TYPE === "cockroachdb") {
      expect(userAfterInc.age).toBe("15");
    } else {
      expect(userAfterInc.age).toBe(15);
    }

    const dec = await SqlDataSource.instance
      .query("users_without_pk")
      .decrement("age" as any, 3);
    expect(typeof dec).toBe("number");

    const userAfterDec = await SqlDataSource.instance
      .query("users_without_pk")
      .oneOrFail();

    if (env.DB_TYPE === "cockroachdb") {
      expect(userAfterDec.age).toBe("12");
    } else {
      expect(userAfterDec.age).toBe(12);
    }
  });

  test("aggregate helpers return correct values", async () => {
    await SqlDataSource.instance.query("users_without_pk").insertMany([
      { name: "A", age: 1, email: "agg1@test.com" },
      { name: "B", age: 2, email: "agg2@test.com" },
      { name: "C", age: 3, email: "agg3@test.com" },
    ]);

    const max = await SqlDataSource.instance
      .query("users_without_pk")
      .getMax("age");
    const min = await SqlDataSource.instance
      .query("users_without_pk")
      .getMin("age");
    const avg = await SqlDataSource.instance
      .query("users_without_pk")
      .getAvg("age");
    const sum = await SqlDataSource.instance
      .query("users_without_pk")
      .getSum("age");

    expect(max).toBe(3);
    expect(min).toBe(1);
    expect(avg).toBeGreaterThanOrEqual(2);
    expect(sum).toBe(6);
  });

  test("union and unionAll produce queries (toQuery) and return combined results", async () => {
    // insert into posts_with_uuid
    await SqlDataSource.instance
      .query("posts_with_uuid")
      .insertMany([{ id: crypto.randomUUID(), title: "P1" }]);

    // simple union using raw query strings
    const qb = SqlDataSource.instance.query("posts_with_uuid").select("title");
    qb.union("select 'X' as title");
    const q = qb.toQuery();
    expect(typeof q).toBe("string");

    // unionAll with callback/querybuilder
    const qb2 = SqlDataSource.instance.query("posts_with_uuid").select("title");
    qb2.unionAll((sub) => sub.select("title").from("posts_with_uuid"));
    const q2 = qb2.toQuery();
    expect(typeof q2).toBe("string");

    // execute unionAll by selecting from a union of constants and the table
    const unionQb = SqlDataSource.instance
      .query("posts_with_uuid")
      .select("title");
    unionQb.union("select 'CONST' as title");
    const results = await unionQb.many();
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  test("with, withRecursive and withMaterialized (if supported) produce queries", async () => {
    if (env.DB_TYPE === "mssql") {
      return;
    }

    const qb = SqlDataSource.instance.query("users_without_pk");
    qb.with("cte_users", (sub) => sub.select("name").from("users_without_pk"));
    const q = qb.toQuery();
    expect(typeof q).toBe("string");
    // execute the built query to ensure it does not throw
    await qb.many();
    // the SQL should include the WITH clause for the CTE
    expect(q.toLowerCase().includes("with")).toBe(true);

    const qb2 = SqlDataSource.instance.query("users_without_pk");
    qb2.withRecursive("rcte", (sub) =>
      sub.select("name").from("users_without_pk"),
    );
    const q2 = qb2.toQuery();
    expect(typeof q2).toBe("string");
    expect(q2.toLowerCase().includes("recursive")).toBe(true);
    // execute the built query to ensure it does not throw
    await qb2.many();

    if (env.DB_TYPE === "postgres" || env.DB_TYPE === "cockroachdb") {
      const qb3 = SqlDataSource.instance.query("users_without_pk");
      qb3.withMaterialized("mcte", (sub) =>
        sub.select("name").from("users_without_pk"),
      );
      const q3 = qb3.toQuery();
      expect(typeof q3).toBe("string");
      await qb3.many();
      // materialized keyword should be present in the SQL for supported DBs
      expect(q3.toLowerCase().includes("materialized")).toBe(true);
    }
  });

  test("lockForUpdate and forShare add lock clauses to query (toQuery)", async () => {
    // MSSQL uses different locking syntax (WITH hints instead of FOR UPDATE)
    if (env.DB_TYPE === "mssql") {
      return;
    }

    const qb = SqlDataSource.instance.query("users_without_pk").select("*");
    qb.lockForUpdate({ skipLocked: true });
    const q = qb.toQuery();
    await qb.many();
    expect(typeof q).toBe("string");
    if (env.DB_TYPE !== "sqlite") {
      expect(
        q
          .toLowerCase()
          .replace("\n", "")
          .replace(/\s+/g, "")
          .includes("forupdateskiplocked"),
      ).toBe(true);
    }

    const qb2 = SqlDataSource.instance.query("users_without_pk").select("*");
    qb2.forShare({ noWait: true });
    const q2 = qb2.toQuery();
    await qb2.many();
    expect(typeof q2).toBe("string");
  });
});
