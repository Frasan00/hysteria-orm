import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { getModelColumns } from "../../../src/sql/models/decorators/model_decorators";
import { PostFactory } from "../test_models/factory/post_factory";
import { UserFactory } from "../test_models/factory/user_factory";
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

describe(`[${env.DB_TYPE}] uuid pk relations`, () => {
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

  test("uuid HasMany relation", async () => {
    const users = await UserFactory.userWithUuid(3);
    const posts = [];
    for (const user of users) {
      const post = await PostFactory.postWithUuid(user.id, 1);
      posts.push(post);
    }

    expect(users).toHaveLength(3);
    expect(posts).toHaveLength(3);

    const userWithLoadedPosts = await UserWithUuid.query()
      .withRelation("posts")
      .many();
    for (const user of userWithLoadedPosts) {
      for (const post of user.posts) {
        expect(post.userId).toBe(user.id);
      }
    }
  });
});
