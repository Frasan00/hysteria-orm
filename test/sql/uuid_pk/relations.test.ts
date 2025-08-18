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
      expect(user.post?.id).toBeUndefined();
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
