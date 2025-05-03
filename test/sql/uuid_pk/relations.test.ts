import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { getModelColumns } from "../../../src/sql/models/decorators/model_decorators";
import { PostFactory } from "../test_models/factory/post_factory";
import { UserFactory } from "../test_models/factory/user_factory";
import { PostWithUuid } from "../test_models/uuid/post_uuid";
import { UserWithUuid } from "../test_models/uuid/user_uuid";
import { AddressFactory } from "../test_models/factory/address_factory";
import { UserAddressFactory } from "../test_models/factory/user_address_factory";
import { AddressWithUuid } from "../test_models/uuid/address_uuid";
import { UserAddressWithUuid } from "../test_models/uuid/user_address_uuid";

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
      .withRelation("post")
      .many();

    for (const user of userWithLoadedPosts) {
      expect(user.id).toBe(user.post.userId);
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
      .withRelation("posts", PostWithUuid, (qb) =>
        qb.where("title", posts[0].title),
      )
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
      .withRelation("post", PostWithUuid, (qb) => qb.withRelation("user"))
      .many();

    for (const user of userWithLoadedPosts) {
      expect(user.id).toBe(user.post.userId);
      expect(user.post.user.id).toBe(user.id);
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
      .withRelation("post", PostWithUuid, (qb) =>
        qb.withRelation("user", UserWithUuid, (qb2) =>
          qb2.withRelation("post", PostWithUuid, (qb3) =>
            qb3.withRelation("user", UserWithUuid),
          ),
        ),
      )
      .many();

    for (const user of userWithLoadedPosts) {
      expect(user.id).toBe(user.post.user.id);
      expect(user.post.user.id).toBe(user.id);
      expect(user.post.user.post.user.id).toBe(user.id);
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

    const userWithLoadedPosts = (await UserWithUuid.query()
      .where("id", user.id)
      .withRelation("posts")
      .one()) as UserWithUuid;

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
      .withRelation("addresses", AddressWithUuid, (qb) =>
        qb.withRelation("users"),
      )
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
      .withRelation("users", UserWithUuid, (qb) =>
        qb.withRelation("posts", PostWithUuid, (qb2) =>
          qb2.withRelation("user", UserWithUuid, (qb3) =>
            qb3.withRelation("addresses", AddressWithUuid, (qb4) =>
              qb4.withRelation("users"),
            ),
          ),
        ),
      )
      .many();

    expect(addressesWithLoadedPosts).toHaveLength(3);
    expect(addressesWithLoadedPosts[0].users).toHaveLength(1);
    expect(addressesWithLoadedPosts[0].users[0].posts).toHaveLength(3);
    expect(addressesWithLoadedPosts[0].users[0].posts[0].user.id).toBe(user.id);
    expect(
      addressesWithLoadedPosts[0].users[0].posts[0].user.addresses,
    ).toHaveLength(3);
  });
});
