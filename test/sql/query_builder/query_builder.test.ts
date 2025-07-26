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

  test("should select a post", async () => {
    await SqlDataSource.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
    });

    const retrievedPost = await SqlDataSource.query("posts_with_uuid").one();

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
      .one();

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

    const count = await SqlDataSource.query("posts_with_uuid").getCount();
    expect(count).toBe(2);
  });

  test("should create a post", async () => {
    await SqlDataSource.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
      content: "Hello World Content",
      short_description: "Hello World Short Description",
    });

    const retrievedPost = await SqlDataSource.query("posts_with_uuid").one();

    expect(retrievedPost).toBeDefined();
    expect(retrievedPost.id).toBeDefined();
    expect(retrievedPost.title).toBe("Hello World");
  });

  test("should create multiple posts", async () => {
    await SqlDataSource.query("posts_with_uuid").insertMany([
      { id: crypto.randomUUID(), title: "Hello World" },
      { id: crypto.randomUUID(), title: "Hello World 2" },
    ]);

    const posts = await SqlDataSource.query("posts_with_uuid")
      .orderBy("title", "asc")
      .many();

    expect(posts).toBeDefined();
    expect(posts.length).toBe(2);
    expect(posts[0].id).toBeDefined();
    expect(posts[1].id).toBeDefined();
    expect(posts[0].title).toBe("Hello World");
    expect(posts[1].title).toBe("Hello World 2");
  });

  test("should update a post", async () => {
    await SqlDataSource.query("posts_with_uuid").insert({
      id: crypto.randomUUID(),
      title: "Hello World",
    });

    await SqlDataSource.query("posts_with_uuid").update({
      title: "Hello World Updated",
    });

    const retrievedPost = await SqlDataSource.query("posts_with_uuid").first();
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
      .one();

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

    const retrievedUser = await SqlDataSource.query("users_without_pk").first();

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

    const retrievedUser = await SqlDataSource.query("users_without_pk").first();
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
    expect(retrievedUserWithDeletedAt.deleted_at).toBeDefined();
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

  test("rawWhere returns correct users", async () => {
    const users = await SqlDataSource.query("users_without_pk")
      .rawWhere("name = 'Bob'")
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
});

// describe(`[${env.DB_TYPE}] with performance`, () => {
//   beforeEach(async () => {
//     await SqlDataSource.query("users_without_pk").insertMany([
//       { name: "Alice", age: 25 },
//       { name: "Bob", age: 30 },
//       { name: "Charlie", age: 35 },
//       { name: "David", age: 40 },
//       { name: null, age: null },
//     ]);
//   });

//   afterEach(async () => {
//     await SqlDataSource.query("users_without_pk").truncate();
//   });

//   test("existsWithPerformance", async () => {
//     const users = await SqlDataSource.query("users_without_pk")
//       .where("name", "Alice")
//       .existsWithPerformance();

//     expect(users.data).toBe(true);
//     expect(users.time).toBeDefined();
//   });

//   test("manyWithPerformance", async () => {
//     const users =
//       await SqlDataSource.query("users_without_pk").manyWithPerformance();

//     expect(users.data).toBeDefined();
//     expect(users.time).toBeDefined();
//   });

//   test("oneWithPerformance", async () => {
//     const user = await SqlDataSource.query("users_without_pk")
//       .where("name", "Alice")
//       .oneWithPerformance();

//     expect(user.data).toBeDefined();
//     expect(user.time).toBeDefined();
//   });

//   test("oneOrFailWithPerformance", async () => {
//     const user = await SqlDataSource.query("users_without_pk")
//       .where("name", "Alice")
//       .oneOrFailWithPerformance();

//     expect(user.data).toBeDefined();
//     expect(user.time).toBeDefined();
//   });

//   test("oneOrFailWithPerformance with ModelQueryBuilder", async () => {
//     const user = await UserWithoutPk.query().oneOrFailWithPerformance();
//     expect(user.data).toBeDefined();
//     expect(user.time).toBeDefined();
//   });

//   test("oneOrFailWithPerformance with ModelQueryBuilder and custom return type", async () => {
//     const user = await UserWithoutPk.query().oneOrFailWithPerformance(
//       {},
//       "seconds"
//     );

//     expect(user.data).toBeDefined();
//     expect(user.time).toBeDefined();
//   });

//   test("paginateWithPerformance", async () => {
//     const users = await SqlDataSource.query("users_without_pk").paginateWithPerformance(1, 10);

//     expect(users.data).toBeDefined();
//     expect(users.time).toBeDefined();
//   });

//   test("paginateWithPerformance with ModelQueryBuilder", async () => {
//     const users = await UserWithoutPk.query().paginateWithPerformance(1, 10);
//     expect(users.data).toBeDefined();
//     expect(users.time).toBeDefined();
//   });

//   test("paginateWithPerformance with ModelQueryBuilder and custom return type", async () => {
//     const users = await UserWithoutPk.query().paginateWithPerformance(1, 10, {}, "seconds");
//     expect(users.data).toBeDefined();
//     expect(users.time).toBeDefined();
//   });
// });
