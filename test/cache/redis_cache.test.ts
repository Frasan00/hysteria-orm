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
});
