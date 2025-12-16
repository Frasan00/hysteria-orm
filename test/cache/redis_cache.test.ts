import { RedisCacheAdapter } from "../../src/cache/adapters/redis";

describe("RedisCacheAdapter", () => {
  let adapter: RedisCacheAdapter;

  beforeAll(() => {
    adapter = new RedisCacheAdapter({
      host: "localhost",
      port: 6379,
      username: "default",
      password: "root",
      db: 0,
    });
  });

  afterAll(async () => {
    await adapter.redisInstance?.quit();
  });

  beforeEach(async () => {
    await adapter.invalidate("test:key");
    await adapter.invalidate("test:key1");
    await adapter.invalidate("test:key2");
    await adapter.invalidate("test:nested");
    await adapter.invalidate("test:nullKey");
    await adapter.invalidate("test:date");
  });

  describe("get/set operations", () => {
    test("should set and get a string value", async () => {
      await adapter.set("test:key", "value");
      const result = await adapter.get<string>("test:key");
      expect(result).toBe("value");
    });

    test("should set and get a number value", async () => {
      await adapter.set("test:key", 123);
      const result = await adapter.get<number>("test:key");
      expect(result).toBe(123);
    });

    test("should set and get an object value", async () => {
      const obj = { name: "John", age: 30 };
      await adapter.set("test:key", obj);
      const result = await adapter.get<typeof obj>("test:key");
      expect(result).toEqual(obj);
    });

    test("should set and get an array value", async () => {
      const arr = [1, 2, 3, 4, 5];
      await adapter.set("test:key", arr);
      const result = await adapter.get<typeof arr>("test:key");
      expect(result).toEqual(arr);
    });

    test("should set and get a boolean value", async () => {
      await adapter.set("test:key", true);
      const result = await adapter.get<boolean>("test:key");
      expect(result).toBe(true);
    });

    test("should return undefined for non-existent key", async () => {
      const result = await adapter.get<string>("test:nonexistent");
      expect(result).toBeUndefined();
    });

    test("should overwrite existing value", async () => {
      await adapter.set("test:key", "original");
      await adapter.set("test:key", "updated");
      const result = await adapter.get<string>("test:key");
      expect(result).toBe("updated");
    });
  });

  describe("TTL operations", () => {
    test("should expire key after TTL (in milliseconds)", async () => {
      await adapter.set("test:key", "value", 100);
      const immediateResult = await adapter.get<string>("test:key");
      expect(immediateResult).toBe("value");

      await new Promise((resolve) => setTimeout(resolve, 200));
      const expiredResult = await adapter.get<string>("test:key");
      expect(expiredResult).toBeUndefined();
    });

    test("should not expire key without TTL", async () => {
      await adapter.set("test:key", "value");
      await new Promise((resolve) => setTimeout(resolve, 100));
      const result = await adapter.get<string>("test:key");
      expect(result).toBe("value");
    });
  });

  describe("invalidate operations", () => {
    test("should invalidate existing key", async () => {
      await adapter.set("test:key", "value");
      await adapter.invalidate("test:key");
      const result = await adapter.get<string>("test:key");
      expect(result).toBeUndefined();
    });

    test("should handle invalidating non-existent key", async () => {
      await expect(
        adapter.invalidate("test:nonexistent"),
      ).resolves.not.toThrow();
    });

    test("should only invalidate specified key", async () => {
      await adapter.set("test:key1", "value1");
      await adapter.set("test:key2", "value2");
      await adapter.invalidate("test:key1");

      const result1 = await adapter.get<string>("test:key1");
      const result2 = await adapter.get<string>("test:key2");

      expect(result1).toBeUndefined();
      expect(result2).toBe("value2");
    });
  });

  describe("complex data types", () => {
    test("should handle nested objects", async () => {
      const nested = {
        user: {
          name: "John",
          address: {
            city: "NYC",
            zip: "10001",
          },
        },
        items: [{ id: 1 }, { id: 2 }],
      };
      await adapter.set("test:nested", nested);
      const result = await adapter.get<typeof nested>("test:nested");
      expect(result).toEqual(nested);
    });

    test("should handle array of objects", async () => {
      const arr = [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ];
      await adapter.set("test:key", arr);
      const result = await adapter.get<typeof arr>("test:key");
      expect(result).toEqual(arr);
    });

    test("should not set null/undefined values", async () => {
      await adapter.set("test:nullKey", null);
      const result = await adapter.get<null>("test:nullKey");
      expect(result).toBeUndefined();
    });
  });

  describe("serialization", () => {
    test("should serialize and deserialize numbers correctly", async () => {
      await adapter.set("test:key", 42.5);
      const result = await adapter.get<number>("test:key");
      expect(result).toBe(42.5);
    });

    test("should serialize and deserialize booleans correctly", async () => {
      await adapter.set("test:key", false);
      const result = await adapter.get<boolean>("test:key");
      expect(result).toBe(false);
    });

    test("should handle plain string without JSON parsing", async () => {
      await adapter.set("test:key", "plain string");
      const result = await adapter.get<string>("test:key");
      expect(result).toBe("plain string");
    });
  });

  describe("invalidateAll operations", () => {
    beforeEach(async () => {
      await adapter.invalidateAll("users");
      await adapter.invalidateAll("posts");
      await adapter.invalidateAll("cache");
      await adapter.invalidateAll("session");
      await adapter.invalidateAll("api");
    });

    test("should invalidate all keys with matching prefix", async () => {
      await adapter.set("users:1", { id: 1, name: "User 1" });
      await adapter.set("users:2", { id: 2, name: "User 2" });
      await adapter.set("users:3", { id: 3, name: "User 3" });
      await adapter.set("posts:1", { id: 1, title: "Post 1" });

      await adapter.invalidateAll("users");

      const user1 = await adapter.get<any>("users:1");
      const user2 = await adapter.get<any>("users:2");
      const user3 = await adapter.get<any>("users:3");
      const post1 = await adapter.get<any>("posts:1");

      expect(user1).toBeUndefined();
      expect(user2).toBeUndefined();
      expect(user3).toBeUndefined();
      expect(post1).toEqual({ id: 1, title: "Post 1" });
    });

    test("should handle invalidateAll with non-existent prefix", async () => {
      await adapter.set("test:key", "value");
      await expect(adapter.invalidateAll("nonexistent")).resolves.not.toThrow();

      const result = await adapter.get<string>("test:key");
      expect(result).toBe("value");
    });

    test("should invalidate all keys when prefix matches multiple patterns", async () => {
      await adapter.set("cache:user:1", "user1");
      await adapter.set("cache:user:2", "user2");
      await adapter.set("cache:post:1", "post1");
      await adapter.set("session:123", "session");

      await adapter.invalidateAll("cache");

      const user1 = await adapter.get<string>("cache:user:1");
      const user2 = await adapter.get<string>("cache:user:2");
      const post1 = await adapter.get<string>("cache:post:1");
      const session = await adapter.get<string>("session:123");

      expect(user1).toBeUndefined();
      expect(user2).toBeUndefined();
      expect(post1).toBeUndefined();
      expect(session).toBe("session");
    });

    test("should handle empty cache on invalidateAll", async () => {
      await expect(adapter.invalidateAll("any:prefix")).resolves.not.toThrow();
    });

    test("should invalidate keys with complex nested prefixes", async () => {
      await adapter.set("api:v1:users:list", [1, 2, 3]);
      await adapter.set("api:v1:users:detail:1", { id: 1 });
      await adapter.set("api:v1:posts:list", [4, 5, 6]);
      await adapter.set("api:v2:users:list", [7, 8, 9]);

      await adapter.invalidateAll("api:v1:users");

      const usersList = await adapter.get<any>("api:v1:users:list");
      const usersDetail = await adapter.get<any>("api:v1:users:detail:1");
      const postsList = await adapter.get<any>("api:v1:posts:list");
      const v2UsersList = await adapter.get<any>("api:v2:users:list");

      expect(usersList).toBeUndefined();
      expect(usersDetail).toBeUndefined();
      expect(postsList).toEqual([4, 5, 6]);
      expect(v2UsersList).toEqual([7, 8, 9]);
    });

    test("should handle special characters in prefix", async () => {
      await adapter.set("special:key*1", "value1");
      await adapter.set("special:key*2", "value2");
      await adapter.set("normal:key", "value3");

      await adapter.invalidateAll("special");

      const special1 = await adapter.get<string>("special:key*1");
      const special2 = await adapter.get<string>("special:key*2");
      const normal = await adapter.get<string>("normal:key");

      expect(special1).toBeUndefined();
      expect(special2).toBeUndefined();
      expect(normal).toBe("value3");
    });
  });
});
