import { InMemoryAdapter } from "../../src/cache/adapters/in_memory";

describe("InMemoryAdapter", () => {
  let adapter: InMemoryAdapter;

  beforeEach(() => {
    adapter = new InMemoryAdapter();
  });

  describe("get/set operations", () => {
    test("should set and get a string value", async () => {
      await adapter.set("key", "value");
      const result = await adapter.get<string>("key");
      expect(result).toBe("value");
    });

    test("should set and get a number value", async () => {
      await adapter.set("key", 123);
      const result = await adapter.get<number>("key");
      expect(result).toBe(123);
    });

    test("should set and get an object value", async () => {
      const obj = { name: "John", age: 30 };
      await adapter.set("key", obj);
      const result = await adapter.get<typeof obj>("key");
      expect(result).toEqual(obj);
    });

    test("should set and get an array value", async () => {
      const arr = [1, 2, 3, 4, 5];
      await adapter.set("key", arr);
      const result = await adapter.get<typeof arr>("key");
      expect(result).toEqual(arr);
    });

    test("should set and get a boolean value", async () => {
      await adapter.set("key", true);
      const result = await adapter.get<boolean>("key");
      expect(result).toBe(true);
    });

    test("should return undefined for non-existent key", async () => {
      const result = await adapter.get<string>("nonexistent");
      expect(result).toBeUndefined();
    });

    test("should overwrite existing value", async () => {
      await adapter.set("key", "original");
      await adapter.set("key", "updated");
      const result = await adapter.get<string>("key");
      expect(result).toBe("updated");
    });
  });

  describe("TTL operations", () => {
    test("should expire key after TTL", async () => {
      await adapter.set("key", "value", 100);
      const immediateResult = await adapter.get<string>("key");
      expect(immediateResult).toBe("value");

      await new Promise((resolve) => setTimeout(resolve, 150));
      const expiredResult = await adapter.get<string>("key");
      expect(expiredResult).toBeUndefined();
    });

    test("should not expire key without TTL", async () => {
      await adapter.set("key", "value");
      await new Promise((resolve) => setTimeout(resolve, 100));
      const result = await adapter.get<string>("key");
      expect(result).toBe("value");
    });
  });

  describe("invalidate operations", () => {
    test("should invalidate existing key", async () => {
      await adapter.set("key", "value");
      await adapter.invalidate("key");
      const result = await adapter.get<string>("key");
      expect(result).toBeUndefined();
    });

    test("should handle invalidating non-existent key", async () => {
      await expect(adapter.invalidate("nonexistent")).resolves.not.toThrow();
    });

    test("should only invalidate specified key", async () => {
      await adapter.set("key1", "value1");
      await adapter.set("key2", "value2");
      await adapter.invalidate("key1");

      const result1 = await adapter.get<string>("key1");
      const result2 = await adapter.get<string>("key2");

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
      await adapter.set("nested", nested);
      const result = await adapter.get<typeof nested>("nested");
      expect(result).toEqual(nested);
    });

    test("should handle Date objects", async () => {
      const date = new Date("2024-01-01");
      await adapter.set("date", date);
      const result = await adapter.get<Date>("date");
      expect(result).toEqual(date);
    });

    test("should handle null value", async () => {
      await adapter.set("nullKey", null);
      const result = await adapter.get<null>("nullKey");
      expect(result).toBeNull();
    });
  });
});
