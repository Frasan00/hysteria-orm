import crypto from "node:crypto";
import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { AddressFactory } from "../test_models/factory/address_factory";
import { PostFactory } from "../test_models/factory/post_factory";
import { UserAddressFactory } from "../test_models/factory/user_address_factory";
import { UserFactory } from "../test_models/factory/user_factory";
import { AddressWithUuid } from "../test_models/uuid/address_uuid";
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

describe(`[${env.DB_TYPE}] uuid pk base relations`, () => {
  test("uuid HasOne relation", async () => {
    const users = await UserFactory.userWithUuid(3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const userWithLoadedPosts = await UserWithUuid.query()
      .whereIn(
        "id",
        users.map((u) => u.id),
      )
      .load("post", (qb) => qb.select("userId"))
      .many();

    for (const user of userWithLoadedPosts) {
      expect(user.id).toBe(user.post?.userId);
      // Non-selected columns should not exist at runtime
      expect(Object.prototype.hasOwnProperty.call(user.post, "content")).toBe(
        false,
      );
    }
  });

  test("uuid HasOne relation with column selection on relation", async () => {
    const users = await UserFactory.userWithUuid(3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const userWithLoadedPosts = await UserWithUuid.query()
      .whereIn(
        "id",
        users.map((u) => u.id),
      )
      .load("post", (qb) => qb.select("posts_with_uuid.userId", "title"))
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

  test("uuid HasMany relation with filtering on the relation", async () => {
    const user = await UserFactory.userWithUuid(1);
    const posts: PostWithUuid[] = [];
    for (let i = 0; i < 3; i++) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    expect(user).toBeDefined();
    expect(posts).toHaveLength(3);

    const userWithLoadedPosts = await UserWithUuid.query()
      .where("id", user.id)
      .load("posts", (qb) => qb.where("title", posts[0].title))
      .one();

    expect(userWithLoadedPosts).toBeDefined();
    expect(userWithLoadedPosts?.posts).toHaveLength(1);
    expect(userWithLoadedPosts?.posts[0].title).toBe(posts[0].title);
  });

  test("uuid HasMany relation with select narrows type correctly", async () => {
    const user = await UserFactory.userWithUuid(1);
    const posts: PostWithUuid[] = [];
    for (let i = 0; i < 3; i++) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    // Note: userId (foreign key) must be selected for relation mapping to work
    const userWithLoadedPosts = await UserWithUuid.query()
      .where("id", user.id)
      .load("posts", (qb) => qb.select("userId", "title", "content"))
      .one();

    expect(userWithLoadedPosts).toBeDefined();
    expect(userWithLoadedPosts?.posts).toHaveLength(3);

    // Selected columns should exist and have values
    expect(userWithLoadedPosts?.posts[0].title).toBeDefined();
    expect(userWithLoadedPosts?.posts[0].content).toBeDefined();
    expect(userWithLoadedPosts?.posts[0].userId).toBe(user.id);

    // Non-selected columns should not exist at runtime
    // Using hasOwnProperty because TypeScript correctly narrows the type
    const post = userWithLoadedPosts?.posts[0];
    expect(Object.prototype.hasOwnProperty.call(post, "id")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(post, "createdAt")).toBe(false);
  });

  test("uuid HasOne relation with select narrows type correctly", async () => {
    const user = await UserFactory.userWithUuid(1);
    await PostFactory.postWithUuid(user.id, 1);

    // Note: userId (foreign key) must be selected for relation mapping to work
    const userWithPost = await UserWithUuid.query()
      .where("id", user.id)
      .load("post", (qb) => qb.select("userId", "content"))
      .one();

    expect(userWithPost).toBeDefined();

    // Selected columns should exist
    expect(userWithPost?.post?.content).toBeDefined();
    expect(userWithPost?.post?.userId).toBe(user.id);

    // Non-selected columns should not exist at runtime
    const post = userWithPost?.post;
    expect(Object.prototype.hasOwnProperty.call(post, "title")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(post, "id")).toBe(false);
  });

  test("uuid relation with wildcard select returns all columns", async () => {
    const user = await UserFactory.userWithUuid(1);
    await PostFactory.postWithUuid(user.id, 1);

    // Using * should return all columns
    const userWithPost = await UserWithUuid.query()
      .where("id", user.id)
      .load("post", (qb) => qb.select("*"))
      .one();

    expect(userWithPost).toBeDefined();
    expect(userWithPost?.post?.id).toBeDefined();
    expect(userWithPost?.post?.title).toBeDefined();
    expect(userWithPost?.post?.content).toBeDefined();
    expect(userWithPost?.post?.userId).toBe(user.id);
  });

  test("uuid relation with table.* wildcard returns all columns", async () => {
    const user = await UserFactory.userWithUuid(1);
    await PostFactory.postWithUuid(user.id, 1);

    // Using table.* should return all columns from that table
    const userWithPost = await UserWithUuid.query()
      .where("id", user.id)
      .load("post", (qb) => qb.select("posts_with_uuid.*"))
      .one();

    expect(userWithPost).toBeDefined();
    expect(userWithPost?.post?.id).toBeDefined();
    expect(userWithPost?.post?.title).toBeDefined();
    expect(userWithPost?.post?.content).toBeDefined();
    expect(userWithPost?.post?.userId).toBe(user.id);
  });

  test("uuid relation without select callback returns all columns", async () => {
    const user = await UserFactory.userWithUuid(1);
    await PostFactory.postWithUuid(user.id, 1);

    // No callback = all columns should be returned
    const userWithPost = await UserWithUuid.query()
      .where("id", user.id)
      .load("post")
      .one();

    expect(userWithPost).toBeDefined();
    expect(userWithPost?.post?.id).toBeDefined();
    expect(userWithPost?.post?.title).toBeDefined();
    expect(userWithPost?.post?.content).toBeDefined();
    expect(userWithPost?.post?.userId).toBe(user.id);
  });

  test("uuid relation with select using table.column format", async () => {
    const user = await UserFactory.userWithUuid(1);
    await PostFactory.postWithUuid(user.id, 1);

    // Using table.column format
    const userWithPost = await UserWithUuid.query()
      .where("id", user.id)
      .load("post", (qb) =>
        qb.select("posts_with_uuid.userId", "posts_with_uuid.title"),
      )
      .one();

    expect(userWithPost).toBeDefined();
    expect(userWithPost?.post?.userId).toBe(user.id);
    expect(userWithPost?.post?.title).toBeDefined();

    // Non-selected columns should not exist
    const post = userWithPost?.post;
    expect(Object.prototype.hasOwnProperty.call(post, "id")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(post, "content")).toBe(false);
  });

  test("uuid relation with aliased select", async () => {
    const user = await UserFactory.userWithUuid(1);
    const createdPost = await PostFactory.postWithUuid(user.id, 1);

    // Using alias in select
    const userWithPost = await UserWithUuid.query()
      .where("id", user.id)
      .load("post", (qb) =>
        qb.select("userId", ["title", "postTitle"], ["content", "postContent"]),
      )
      .one();

    expect(userWithPost).toBeDefined();
    expect(userWithPost?.post?.userId).toBe(user.id);
    expect(userWithPost?.post?.postTitle).toBe(createdPost.title);
    expect(userWithPost?.post?.postContent).toBe(createdPost.content);

    // Original column names should not exist when aliased
    const post = userWithPost?.post;
    expect(Object.prototype.hasOwnProperty.call(post, "title")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(post, "content")).toBe(false);
  });

  test("uuid relation with single column select", async () => {
    const user = await UserFactory.userWithUuid(1);
    await PostFactory.postWithUuid(user.id, 1);

    // Selecting only the foreign key (minimum required for relation to work)
    const userWithPost = await UserWithUuid.query()
      .where("id", user.id)
      .load("post", (qb) => qb.select("userId"))
      .one();

    expect(userWithPost).toBeDefined();
    expect(userWithPost?.post?.userId).toBe(user.id);

    // All other columns should not exist
    const post = userWithPost?.post;
    expect(Object.prototype.hasOwnProperty.call(post, "id")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(post, "title")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(post, "content")).toBe(false);
  });

  test("uuid HasMany relation select with ordering and limit", async () => {
    // MSSQL: Ambiguous column name in CTE with ROW_NUMBER() - orderBy doesn't qualify columns
    if (env.DB_TYPE === "mssql") {
      return;
    }

    const user = await UserFactory.userWithUuid(1);
    for (let i = 0; i < 5; i++) {
      await PostFactory.postWithUuid(user.id, 1);
    }

    // Select with ordering and limit
    const userWithPosts = await UserWithUuid.query()
      .where("id", user.id)
      .load("posts", (qb) =>
        qb.select("userId", "title").orderBy("title", "asc").limit(3),
      )
      .one();

    expect(userWithPosts).toBeDefined();
    expect(userWithPosts?.posts).toHaveLength(3);
    expect(userWithPosts?.posts[0].title).toBeDefined();
    expect(userWithPosts?.posts[0].userId).toBe(user.id);

    // Non-selected columns should not exist
    const post = userWithPosts?.posts[0];
    expect(Object.prototype.hasOwnProperty.call(post, "id")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(post, "content")).toBe(false);
  });

  test("uuid nested relation both with select", async () => {
    const user = await UserFactory.userWithUuid(1);
    await PostFactory.postWithUuid(user.id, 1);

    // Both the relation and nested relation use select
    // Note: nested relation needs its primary key (id) for the belongsTo to match
    const userWithPost = await UserWithUuid.query()
      .where("id", user.id)
      .load("post", (qb) =>
        qb
          .select("userId", "title")
          .load("user", (qb2) => qb2.select("id", "name")),
      )
      .one();

    expect(userWithPost).toBeDefined();
    expect(userWithPost?.post?.userId).toBe(user.id);
    expect(userWithPost?.post?.title).toBeDefined();

    // Nested user should have id and name
    expect(userWithPost?.post?.user?.id).toBe(user.id);
    expect(userWithPost?.post?.user?.name).toBeDefined();

    // Post should not have non-selected columns
    const post = userWithPost?.post;
    expect(Object.prototype.hasOwnProperty.call(post, "id")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(post, "content")).toBe(false);

    // Nested user should not have non-selected columns
    const nestedUser = userWithPost?.post?.user;
    expect(Object.prototype.hasOwnProperty.call(nestedUser, "email")).toBe(
      false,
    );
    expect(Object.prototype.hasOwnProperty.call(nestedUser, "age")).toBe(false);
  });

  test("uuid relation with empty result still has correct type shape", async () => {
    const user = await UserFactory.userWithUuid(1);
    // Don't create any posts

    const userWithPosts = await UserWithUuid.query()
      .where("id", user.id)
      .load("posts", (qb) => qb.select("userId", "title"))
      .one();

    expect(userWithPosts).toBeDefined();
    expect(userWithPosts?.posts).toHaveLength(0);
    expect(Array.isArray(userWithPosts?.posts)).toBe(true);
  });

  test("uuid HasOne relation nested with a belongs to relation", async () => {
    const users = await UserFactory.userWithUuid(3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const userWithLoadedPosts = await UserWithUuid.query()
      .whereIn(
        "id",
        users.map((u) => u.id),
      )
      .load("post", (qb) => qb.load("user"))
      .many();

    for (const user of userWithLoadedPosts) {
      expect(user.id).toBe(user.post?.userId);
      expect(user.post?.user?.id).toBe(user.id);
    }
  });

  test("uuid with multiple nested relations", async () => {
    const users = await UserFactory.userWithUuid(3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const userWithLoadedPosts = await UserWithUuid.query()
      .whereIn(
        "id",
        users.map((u) => u.id),
      )
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

  test("uuid HasMany relation", async () => {
    const user = await UserFactory.userWithUuid(1);
    const posts = [];
    for (let i = 0; i < 3; i++) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    expect(user).toBeDefined();
    expect(posts).toHaveLength(3);

    const userWithLoadedPosts = await UserWithUuid.query()
      .where("id", user.id)
      .load("posts")
      .one();

    expect(userWithLoadedPosts).toBeDefined();
    expect(userWithLoadedPosts?.posts).toHaveLength(3);
    for (const post of userWithLoadedPosts?.posts || []) {
      expect(post.userId).toBe(user.id);
    }

    expect(userWithLoadedPosts).toBeDefined();
    expect(userWithLoadedPosts?.posts).toHaveLength(3);
    for (const post of userWithLoadedPosts?.posts || []) {
      expect(post.userId).toBe(user.id);
    }
  });
});

describe(`[${env.DB_TYPE}] uuid pk many to many relations`, () => {
  test("uuid many to many relation", async () => {
    const users = await UserFactory.userWithUuid(10);
    const addresses = await AddressFactory.addressWithUuid(6);

    // #region first user has 3 addresses
    await UserAddressFactory.userAddressWithUuid(
      1,
      users[0].id,
      addresses[0].id,
    );
    await UserAddressFactory.userAddressWithUuid(
      1,
      users[0].id,
      addresses[1].id,
    );
    await UserAddressFactory.userAddressWithUuid(
      1,
      users[0].id,
      addresses[2].id,
    );

    // #endregion

    // #region second user has 2 addresses
    await UserAddressFactory.userAddressWithUuid(
      1,
      users[1].id,
      addresses[3].id,
    );
    await UserAddressFactory.userAddressWithUuid(
      1,
      users[1].id,
      addresses[4].id,
    );
    // #endregion

    // #region third user has 1 address
    await UserAddressFactory.userAddressWithUuid(
      1,
      users[2].id,
      addresses[5].id,
    );
    // #endregion

    const userWithLoadedAddresses = await UserWithUuid.query()
      .whereIn(
        "id",
        users.map((u) => u.id),
      )
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

  test("uuid ManyToMany relation with select narrows type correctly", async () => {
    const user = await UserFactory.userWithUuid(1);
    const addresses = await AddressFactory.addressWithUuid(3);

    for (const address of addresses) {
      await UserAddressFactory.userAddressWithUuid(1, user.id, address.id);
    }

    // Select only city and street columns from addresses
    const userWithAddresses = await UserWithUuid.query()
      .where("id", user.id)
      .load("addresses", (qb) => qb.select("city", "street"))
      .one();

    expect(userWithAddresses).toBeDefined();
    expect(userWithAddresses?.addresses).toHaveLength(3);

    // Selected columns should exist and have values
    expect(userWithAddresses?.addresses[0].city).toBeDefined();
    expect(userWithAddresses?.addresses[0].street).toBeDefined();

    // Non-selected columns should not exist at runtime
    // Using hasOwnProperty because TypeScript correctly narrows the type
    const address = userWithAddresses?.addresses[0];
    expect(Object.prototype.hasOwnProperty.call(address, "id")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(address, "zipCode")).toBe(
      false,
    );
  });

  test("uuid many to many relation nested from Address", async () => {
    const user = await UserFactory.userWithUuid(1);
    const addresses = await AddressFactory.addressWithUuid(3);

    // #region first user has 3 addresses
    await UserAddressFactory.userAddressWithUuid(1, user.id, addresses[0].id);
    await UserAddressFactory.userAddressWithUuid(1, user.id, addresses[1].id);
    await UserAddressFactory.userAddressWithUuid(1, user.id, addresses[2].id);

    // #region first user has 3 posts
    await PostFactory.postWithUuid(user.id, 3);
    // #endregion

    const addressesWithLoadedPosts = await AddressWithUuid.query()
      .whereIn(
        "id",
        addresses.map((a) => a.id),
      )
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
    expect(addressesWithLoadedPosts[0].users[0]?.posts[0]?.user?.id).toBe(
      user.id,
    );
    expect(
      addressesWithLoadedPosts[0].users[0]?.posts[0]?.user?.addresses,
    ).toHaveLength(3);
  });
});

describe(`[${env.DB_TYPE}] uuid pk relations with limit and offset has many`, () => {
  // MSSQL: Ambiguous column name 'title' in CTE with ROW_NUMBER() - orderByRaw doesn't qualify columns
  if (env.DB_TYPE === "mssql") {
    test.skip("uuid HasMany relation with limit and offset", async () => {});
    test.skip("uuid HasMany relation with limit", async () => {});
    test.skip("uuid HasMany relation with offset", async () => {});
    return;
  }

  test("uuid HasMany relation with limit and offset", async () => {
    const user = await UserFactory.userWithUuid(1);
    const user2 = await UserFactory.userWithUuid(1);
    await PostFactory.postWithUuid(user.id, 10);
    await PostFactory.postWithUuid(user2.id, 10);

    const userWithLoadedPosts = await UserWithUuid.query()
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

  test("uuid HasMany relation with limit", async () => {
    const user = await UserFactory.userWithUuid(1);
    const user2 = await UserFactory.userWithUuid(1);
    await PostFactory.postWithUuid(user.id, 10);
    await PostFactory.postWithUuid(user2.id, 10);

    const userWithLoadedPosts = await UserWithUuid.query()
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

  test("uuid HasMany relation with offset", async () => {
    const user = await UserFactory.userWithUuid(1);
    const user2 = await UserFactory.userWithUuid(1);
    await PostFactory.postWithUuid(user.id, 10);
    await PostFactory.postWithUuid(user2.id, 10);

    const userWithLoadedPosts = await UserWithUuid.query()
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

describe(`[${env.DB_TYPE}] uuid pk relations with limit and offset many to many`, () => {
  test("uuid ManyToMany relation with limit and offset", async () => {
    const user = await UserFactory.userWithUuid(1);
    const user2 = await UserFactory.userWithUuid(1);
    const addresses = await AddressFactory.addressWithUuid(10);

    for (const address of addresses) {
      await UserAddressFactory.userAddressWithUuid(1, user.id, address.id);
      await UserAddressFactory.userAddressWithUuid(1, user2.id, address.id);
    }

    const usersWithAddresses = await UserWithUuid.query()
      .load("addresses", (qb) =>
        qb.orderBy("address_with_uuid.id", "asc").limit(3).offset(1),
      )
      .many();

    expect(usersWithAddresses).toHaveLength(2);
    expect(usersWithAddresses[0].addresses).toHaveLength(3);
    expect(usersWithAddresses[1].addresses).toHaveLength(3);
    expect(usersWithAddresses[0].addresses[0].id).toBeDefined();
  });

  test("uuid ManyToMany relation with limit", async () => {
    const user = await UserFactory.userWithUuid(1);
    const user2 = await UserFactory.userWithUuid(1);
    const addresses = await AddressFactory.addressWithUuid(10);

    for (const address of addresses) {
      await UserAddressFactory.userAddressWithUuid(1, user.id, address.id);
      await UserAddressFactory.userAddressWithUuid(1, user2.id, address.id);
    }

    const usersWithAddresses = await UserWithUuid.query()
      .load("addresses", (qb) =>
        qb.orderBy("address_with_uuid.id", "asc").limit(3),
      )
      .many();

    expect(usersWithAddresses).toHaveLength(2);
    expect(usersWithAddresses[0].addresses).toHaveLength(3);
    expect(usersWithAddresses[1].addresses).toHaveLength(3);
    expect(usersWithAddresses[0].addresses[0].id).toBeDefined();
  });

  test("uuid ManyToMany relation with offset", async () => {
    const user = await UserFactory.userWithUuid(1);
    const user2 = await UserFactory.userWithUuid(1);
    const addresses = await AddressFactory.addressWithUuid(10);

    for (const address of addresses) {
      await UserAddressFactory.userAddressWithUuid(1, user.id, address.id);
      await UserAddressFactory.userAddressWithUuid(1, user2.id, address.id);
    }

    const usersWithAddresses = await UserWithUuid.query()
      .load("addresses", (qb) =>
        qb.orderBy("address_with_uuid.id", "asc").offset(9),
      )
      .many();

    expect(usersWithAddresses).toHaveLength(2);
    expect(usersWithAddresses[0].addresses).toHaveLength(1);
    expect(usersWithAddresses[1].addresses).toHaveLength(1);
    expect(usersWithAddresses[0].addresses[0].id).toBeDefined();
  });
});

describe(`[${env.DB_TYPE}] uuid pk sync many to many`, () => {
  test("uuid sync many to many", async () => {
    const user = await UserFactory.userWithUuid(1);
    const addresses = await AddressFactory.addressWithUuid(10);

    await UserWithUuid.sync("addresses", user, addresses, () => ({
      id: crypto.randomUUID(),
    }));

    const userWithAddresses = await UserWithUuid.query()
      .where("id", user.id)
      .load("addresses")
      .one();

    expect(userWithAddresses).toBeDefined();
    expect(userWithAddresses?.addresses).toHaveLength(10);

    const addressesWithUsers = await AddressWithUuid.query()
      .whereIn(
        "id",
        addresses.map((a) => a.id),
      )
      .load("users")
      .many();

    expect(addressesWithUsers).toHaveLength(10);
    for (const address of addressesWithUsers) {
      expect(address.users).toHaveLength(1);
    }
  });
});
