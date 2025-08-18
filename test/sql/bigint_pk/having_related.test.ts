import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { PostWithBigint } from "../test_models/bigint/post_bigint";
import { UserWithBigint } from "../test_models/bigint/user_bigint";
import { AddressFactory } from "../test_models/factory/address_factory";
import { PostFactory } from "../test_models/factory/post_factory";
import { UserAddressFactory } from "../test_models/factory/user_address_factory";
import { UserFactory } from "../test_models/factory/user_factory";

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

describe(`[${env.DB_TYPE}] havingRelated (bigint)`, () => {
  test("base case: has at least one related post", async () => {
    const [u1, u2] = await UserFactory.userWithBigint(2);
    await PostFactory.postWithBigint(u1.id, 1);
    const noisyUsers = await UserFactory.userWithBigint(2);
    for (const nu of noisyUsers) {
      await PostFactory.postWithBigint(nu.id, 2);
    }

    const users = await UserWithBigint.query()
      .whereIn("id", [u1.id, u2.id])
      .havingRelated("posts")
      .many();
    const ids = users.map((u) => u.id);
    expect(ids).toContain(u1.id);
    expect(ids).not.toContain(u2.id);
  });

  test("with callback: has post with specific title", async () => {
    const [u1, u2] = await UserFactory.userWithBigint(2);
    const p = await PostFactory.postWithBigint(u1.id, 1);
    await PostFactory.postWithBigint(u1.id, 1);
    const noisyUsers = await UserFactory.userWithBigint(2);
    for (const nu of noisyUsers) {
      await PostFactory.postWithBigint(nu.id, 2);
    }

    const users = await UserWithBigint.query()
      .whereIn("id", [u1.id, u2.id])
      .havingRelated("posts", (qb) => qb.where("title", p.title))
      .many();

    const ids = users.map((u) => u.id);
    expect(ids).toContain(u1.id);
    expect(ids).not.toContain(u2.id);
  });

  test("with operator/value: more than N posts", async () => {
    const [u1, u2] = await UserFactory.userWithBigint(2);
    await PostFactory.postWithBigint(u1.id, 6);
    await PostFactory.postWithBigint(u2.id, 2);
    const u3 = await UserFactory.userWithBigint(1);
    await PostFactory.postWithBigint(u3.id, 5);

    const users = await UserWithBigint.query()
      .whereIn("id", [u1.id, u2.id, u3.id])
      .havingRelated("posts", ">", 5)
      .many();
    const ids = users.map((u) => u.id);
    expect(ids).toContain(u1.id);
    expect(ids).not.toContain(u2.id);
  });

  test("orHavingRelated: returns users with posts even if prior where filters none", async () => {
    const [u1] = await UserFactory.userWithBigint(2);
    await PostFactory.postWithBigint(u1.id, 1);
    const users = await UserWithBigint.query()
      .where("id", "=", -1)
      .orHavingRelated("posts")
      .many();
    const ids = users.map((u) => u.id);
    expect(ids).toContain(u1.id);
  });

  test("notHavingRelated: returns users without posts", async () => {
    const [u1, u2] = await UserFactory.userWithBigint(2);
    await PostFactory.postWithBigint(u2.id, 1);
    const users = await UserWithBigint.query().notHavingRelated("posts").many();
    const ids = users.map((u) => u.id);
    expect(ids).toContain(u1.id);
    expect(ids).not.toContain(u2.id);
  });

  test("orNotHavingRelated: returns users without posts even if prior where filters none", async () => {
    const [u1] = await UserFactory.userWithBigint(2);
    const users = await UserWithBigint.query()
      .where("id", "=", -1)
      .orNotHavingRelated("posts")
      .many();
    const ids = users.map((u) => u.id);
    expect(ids).toContain(u1.id);
  });

  test("hasOne: user has a single post", async () => {
    const [u1, u2] = await UserFactory.userWithBigint(2);
    await PostFactory.postWithBigint(u1.id, 1);
    const u3 = await UserFactory.userWithBigint(1);
    await PostFactory.postWithBigint(u3.id, 1);

    const users = await UserWithBigint.query()
      .whereIn("id", [u1.id, u2.id])
      .havingRelated("post")
      .many();
    const ids = users.map((u) => u.id);
    expect(ids).toContain(u1.id);
    expect(ids).not.toContain(u2.id);
  });

  test("manyToMany base case: user has addresses", async () => {
    const [u1, u2] = await UserFactory.userWithBigint(2);
    const addresses = await AddressFactory.addressWithBigint(3);
    for (const addr of addresses) {
      await UserAddressFactory.userAddressWithBigint(1, u1.id, addr.id);
    }

    const u3 = await UserFactory.userWithBigint(1);
    const noiseAddrs = await AddressFactory.addressWithBigint(2);
    for (const addr of noiseAddrs) {
      await UserAddressFactory.userAddressWithBigint(1, u3.id, addr.id);
    }

    const users = await UserWithBigint.query()
      .whereIn("id", [u1.id, u2.id])
      .havingRelated("addresses")
      .many();
    const ids = users.map((u) => u.id);
    expect(ids).toContain(u1.id);
    expect(ids).not.toContain(u2.id);
  });

  test("manyToMany with operator/value: more than N addresses", async () => {
    const [u1, u2] = await UserFactory.userWithBigint(2);
    const addrsU1 = await AddressFactory.addressWithBigint(6);
    const addrsU2 = await AddressFactory.addressWithBigint(2);
    for (const a of addrsU1) {
      await UserAddressFactory.userAddressWithBigint(1, u1.id, a.id);
    }
    for (const a of addrsU2) {
      await UserAddressFactory.userAddressWithBigint(1, u2.id, a.id);
    }
    const u3 = await UserFactory.userWithBigint(1);
    const addrsU3 = await AddressFactory.addressWithBigint(5);
    for (const a of addrsU3) {
      await UserAddressFactory.userAddressWithBigint(1, u3.id, a.id);
    }

    const users = await UserWithBigint.query()
      .whereIn("id", [u1.id, u2.id, u3.id])
      .havingRelated("addresses", ">", 5)
      .many();
    const ids = users.map((u) => u.id);
    expect(ids).toContain(u1.id);
    expect(ids).not.toContain(u2.id);
  });

  test("belongsTo with callback: posts with specific user", async () => {
    const [u1, u2] = await UserFactory.userWithBigint(2);
    await PostFactory.postWithBigint(u1.id, 3);
    await PostFactory.postWithBigint(u2.id, 1);

    const posts = await PostWithBigint.query()
      .havingRelated("user", (qb) => qb.where("id", u1.id))
      .many();
    expect(posts.length).toBe(3);
    for (const p of posts) {
      expect(p.userId).toBe(u1.id);
    }
  });
});
