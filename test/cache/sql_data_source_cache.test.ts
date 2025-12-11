import { InMemoryAdapter } from "../../src/cache/adapters/in_memory";
import { RedisCacheAdapter } from "../../src/cache/adapters/redis";
import { SqlDataSource } from "../../src/sql/sql_data_source";

describe("SqlDataSource Cache Integration", () => {
  describe("InMemoryAdapter integration", () => {
    let sql: Awaited<ReturnType<typeof createInMemoryDataSource>>;

    async function createInMemoryDataSource() {
      return SqlDataSource.connectToSecondarySource({
        type: "sqlite",
        database: ":memory:",
        logs: false,
        cacheStrategy: {
          cacheAdapter: new InMemoryAdapter(),
          keys: {
            noArgsKey: async () => "computed-no-args",
            stringKey: async (name: string) => `hello ${name}`,
            numberKey: async (num: number) => num * 2,
            objectKey: async (id: number, name: string) => ({ id, name }),
            asyncFetch: async (userId: string) => {
              await new Promise((resolve) => setTimeout(resolve, 10));
              return { userId, data: "fetched" };
            },
          },
        },
      });
    }

    beforeAll(async () => {
      sql = await createInMemoryDataSource();
    });

    afterAll(async () => {
      await sql.disconnect();
    });

    beforeEach(async () => {
      await sql.invalidCache("noArgsKey");
      await sql.invalidCache("stringKey");
      await sql.invalidCache("numberKey");
      await sql.invalidCache("objectKey");
      await sql.invalidCache("asyncFetch");
    });

    describe("useCache basic operations", () => {
      test("should compute and cache value for handler with no args", async () => {
        const result = await sql.useCache("noArgsKey");
        expect(result).toBe("computed-no-args");

        const cachedResult = await sql.useCache("noArgsKey");
        expect(cachedResult).toBe("computed-no-args");
      });

      test("should compute and cache value with string argument", async () => {
        const result = await sql.useCache("stringKey", "World");
        expect(result).toBe("hello World");
      });

      test("should compute and cache value with number argument", async () => {
        const result = await sql.useCache("numberKey", 21);
        expect(result).toBe(42);
      });

      test("should compute and cache value with multiple arguments", async () => {
        const result = await sql.useCache("objectKey", 1, "John");
        expect(result).toEqual({ id: 1, name: "John" });
      });

      test("should return cached value on subsequent calls", async () => {
        let callCount = 0;
        const sqlWithCounter = await SqlDataSource.connectToSecondarySource({
          type: "sqlite",
          database: ":memory:",
          logs: false,
          cacheStrategy: {
            cacheAdapter: new InMemoryAdapter(),
            keys: {
              countedKey: async () => {
                callCount++;
                return `call-${callCount}`;
              },
            },
          },
        });

        const first = await sqlWithCounter.useCache("countedKey");
        const second = await sqlWithCounter.useCache("countedKey");

        expect(first).toBe("call-1");
        expect(second).toBe("call-1");
        expect(callCount).toBe(1);

        await sqlWithCounter.disconnect();
      });
    });

    describe("useCache with TTL", () => {
      test("should use TTL when provided as first argument (handler with no args)", async () => {
        const result = await sql.useCache("noArgsKey", 100);
        expect(result).toBe("computed-no-args");
      });

      test("should use TTL when provided with handler args", async () => {
        const result = await sql.useCache("stringKey", 1000, "WithTTL");
        expect(result).toBe("hello WithTTL");
      });

      test("should expire cached value after TTL", async () => {
        let callCount = 0;
        const sqlWithTTL = await SqlDataSource.connectToSecondarySource({
          type: "sqlite",
          database: ":memory:",
          logs: false,
          cacheStrategy: {
            cacheAdapter: new InMemoryAdapter(),
            keys: {
              expiring: async () => {
                callCount++;
                return `call-${callCount}`;
              },
            },
          },
        });

        const first = await sqlWithTTL.useCache("expiring", 50);
        expect(first).toBe("call-1");
        expect(callCount).toBe(1);

        await new Promise((resolve) => setTimeout(resolve, 100));

        const second = await sqlWithTTL.useCache("expiring", 50);
        expect(second).toBe("call-2");
        expect(callCount).toBe(2);

        await sqlWithTTL.disconnect();
      });
    });

    describe("invalidCache operations", () => {
      test("should invalidate cached value", async () => {
        let callCount = 0;
        const sqlWithCounter = await SqlDataSource.connectToSecondarySource({
          type: "sqlite",
          database: ":memory:",
          logs: false,
          cacheStrategy: {
            cacheAdapter: new InMemoryAdapter(),
            keys: {
              invalidatable: async () => {
                callCount++;
                return `call-${callCount}`;
              },
            },
          },
        });

        const first = await sqlWithCounter.useCache("invalidatable");
        expect(first).toBe("call-1");

        await sqlWithCounter.invalidCache("invalidatable");

        const second = await sqlWithCounter.useCache("invalidatable");
        expect(second).toBe("call-2");
        expect(callCount).toBe(2);

        await sqlWithCounter.disconnect();
      });
    });

    describe("async handler operations", () => {
      test("should handle async handlers correctly", async () => {
        const result = await sql.useCache("asyncFetch", "user-123");
        expect(result).toEqual({ userId: "user-123", data: "fetched" });
      });
    });
  });

  describe("RedisCacheAdapter integration", () => {
    let sql: Awaited<ReturnType<typeof createRedisDataSource>>;

    async function createRedisDataSource() {
      return SqlDataSource.connectToSecondarySource({
        type: "sqlite",
        database: ":memory:",
        logs: false,
        cacheStrategy: {
          cacheAdapter: new RedisCacheAdapter({
            host: "localhost",
            port: 6379,
            username: "default",
            password: "root",
            db: 0,
          }),
          keys: {
            noArgsKey: async () => "computed-no-args",
            stringKey: async (name: string) => `hello ${name}`,
            objectKey: async (id: number, name: string) => ({ id, name }),
          },
        },
      });
    }

    beforeAll(async () => {
      sql = await createRedisDataSource();
    });

    afterAll(async () => {
      await sql.invalidCache("noArgsKey");
      await sql.invalidCache("stringKey");
      await sql.invalidCache("objectKey");
      await sql.disconnect();
    });

    beforeEach(async () => {
      await sql.invalidCache("noArgsKey");
      await sql.invalidCache("stringKey");
      await sql.invalidCache("objectKey");
    });

    describe("useCache basic operations", () => {
      test("should compute and cache value for handler with no args", async () => {
        const result = await sql.useCache("noArgsKey");
        expect(result).toBe("computed-no-args");
      });

      test("should compute and cache value with string argument", async () => {
        const result = await sql.useCache("stringKey", "Redis");
        expect(result).toBe("hello Redis");
      });

      test("should compute and cache value with multiple arguments", async () => {
        const result = await sql.useCache("objectKey", 42, "Redis User");
        expect(result).toEqual({ id: 42, name: "Redis User" });
      });

      test("should return cached value from Redis on subsequent calls", async () => {
        let callCount = 0;
        const sqlWithCounter = await SqlDataSource.connectToSecondarySource({
          type: "sqlite",
          database: ":memory:",
          logs: false,
          cacheStrategy: {
            cacheAdapter: new RedisCacheAdapter({
              host: "localhost",
              port: 6379,
              username: "default",
              password: "root",
              db: 0,
            }),
            keys: {
              redisCountedKey: async () => {
                callCount++;
                return `redis-call-${callCount}`;
              },
            },
          },
        });

        await sqlWithCounter.invalidCache("redisCountedKey");

        const first = await sqlWithCounter.useCache("redisCountedKey");
        const second = await sqlWithCounter.useCache("redisCountedKey");

        expect(first).toBe("redis-call-1");
        expect(second).toBe("redis-call-1");
        expect(callCount).toBe(1);

        await sqlWithCounter.invalidCache("redisCountedKey");
        await sqlWithCounter.disconnect();
      });
    });

    describe("useCache with TTL", () => {
      test("should expire cached value after TTL in Redis", async () => {
        let callCount = 0;
        const sqlWithTTL = await SqlDataSource.connectToSecondarySource({
          type: "sqlite",
          database: ":memory:",
          logs: false,
          cacheStrategy: {
            cacheAdapter: new RedisCacheAdapter({
              host: "localhost",
              port: 6379,
              username: "default",
              password: "root",
              db: 0,
            }),
            keys: {
              redisExpiring: async () => {
                callCount++;
                return `redis-call-${callCount}`;
              },
            },
          },
        });

        await sqlWithTTL.invalidCache("redisExpiring");

        const first = await sqlWithTTL.useCache("redisExpiring", 100);
        expect(first).toBe("redis-call-1");
        expect(callCount).toBe(1);

        await new Promise((resolve) => setTimeout(resolve, 200));

        const second = await sqlWithTTL.useCache("redisExpiring", 100);
        expect(second).toBe("redis-call-2");
        expect(callCount).toBe(2);

        await sqlWithTTL.invalidCache("redisExpiring");
        await sqlWithTTL.disconnect();
      });
    });

    describe("invalidCache operations", () => {
      test("should invalidate cached value in Redis", async () => {
        let callCount = 0;
        const sqlWithCounter = await SqlDataSource.connectToSecondarySource({
          type: "sqlite",
          database: ":memory:",
          logs: false,
          cacheStrategy: {
            cacheAdapter: new RedisCacheAdapter({
              host: "localhost",
              port: 6379,
              username: "default",
              password: "root",
              db: 0,
            }),
            keys: {
              redisInvalidatable: async () => {
                callCount++;
                return `redis-call-${callCount}`;
              },
            },
          },
        });

        await sqlWithCounter.invalidCache("redisInvalidatable");

        const first = await sqlWithCounter.useCache("redisInvalidatable");
        expect(first).toBe("redis-call-1");

        await sqlWithCounter.invalidCache("redisInvalidatable");

        const second = await sqlWithCounter.useCache("redisInvalidatable");
        expect(second).toBe("redis-call-2");
        expect(callCount).toBe(2);

        await sqlWithCounter.invalidCache("redisInvalidatable");
        await sqlWithCounter.disconnect();
      });
    });
  });

  describe("Error handling", () => {
    test("should throw error when cache adapter is not configured", async () => {
      const sqlWithoutCache = await SqlDataSource.connectToSecondarySource({
        type: "sqlite",
        database: ":memory:",
        logs: false,
      });

      await expect(
        (sqlWithoutCache as any).useCache("anyKey"),
      ).rejects.toThrow();

      await sqlWithoutCache.disconnect();
    });

    test("should throw error for non-existent cache key", async () => {
      const sqlWithCache = await SqlDataSource.connectToSecondarySource({
        type: "sqlite",
        database: ":memory:",
        logs: false,
        cacheStrategy: {
          cacheAdapter: new InMemoryAdapter(),
          keys: {
            existingKey: async () => "value",
          },
        },
      });

      await expect(
        (sqlWithCache as any).useCache("nonExistentKey"),
      ).rejects.toThrow();

      await sqlWithCache.disconnect();
    });
  });

  describe("Argument hashing and cache key generation", () => {
    test("should cache separately for same key with different arguments", async () => {
      let callCount = 0;
      const sqlWithHashing = await SqlDataSource.connectToSecondarySource({
        type: "sqlite",
        database: ":memory:",
        logs: false,
        cacheStrategy: {
          cacheAdapter: new InMemoryAdapter(),
          keys: {
            userById: async (id: number) => {
              callCount++;
              return { id, call: callCount };
            },
          },
        },
      });

      const user1First = await sqlWithHashing.useCache("userById", 1);
      const user2First = await sqlWithHashing.useCache("userById", 2);
      const user1Second = await sqlWithHashing.useCache("userById", 1);
      const user2Second = await sqlWithHashing.useCache("userById", 2);

      expect(user1First).toEqual({ id: 1, call: 1 });
      expect(user2First).toEqual({ id: 2, call: 2 });
      expect(user1Second).toEqual({ id: 1, call: 1 });
      expect(user2Second).toEqual({ id: 2, call: 2 });
      expect(callCount).toBe(2);

      await sqlWithHashing.disconnect();
    });

    test("should cache separately for complex object arguments", async () => {
      let callCount = 0;
      const sqlWithObjects = await SqlDataSource.connectToSecondarySource({
        type: "sqlite",
        database: ":memory:",
        logs: false,
        cacheStrategy: {
          cacheAdapter: new InMemoryAdapter(),
          keys: {
            complexArgs: async (filter: { status: string; page: number }) => {
              callCount++;
              return { ...filter, call: callCount };
            },
          },
        },
      });

      const result1 = await sqlWithObjects.useCache("complexArgs", {
        status: "active",
        page: 1,
      });
      const result2 = await sqlWithObjects.useCache("complexArgs", {
        status: "inactive",
        page: 1,
      });
      const result1Cached = await sqlWithObjects.useCache("complexArgs", {
        status: "active",
        page: 1,
      });

      expect(result1).toEqual({ status: "active", page: 1, call: 1 });
      expect(result2).toEqual({ status: "inactive", page: 1, call: 2 });
      expect(result1Cached).toEqual({ status: "active", page: 1, call: 1 });
      expect(callCount).toBe(2);

      await sqlWithObjects.disconnect();
    });

    test("should handle array arguments correctly", async () => {
      let callCount = 0;
      const sqlWithArrays = await SqlDataSource.connectToSecondarySource({
        type: "sqlite",
        database: ":memory:",
        logs: false,
        cacheStrategy: {
          cacheAdapter: new InMemoryAdapter(),
          keys: {
            arrayArgs: async (ids: number[]) => {
              callCount++;
              return { ids, call: callCount };
            },
          },
        },
      });

      const result1 = await sqlWithArrays.useCache("arrayArgs", [1, 2, 3]);
      const result2 = await sqlWithArrays.useCache("arrayArgs", [4, 5, 6]);
      const result1Cached = await sqlWithArrays.useCache(
        "arrayArgs",
        [1, 2, 3],
      );

      expect(result1).toEqual({ ids: [1, 2, 3], call: 1 });
      expect(result2).toEqual({ ids: [4, 5, 6], call: 2 });
      expect(result1Cached).toEqual({ ids: [1, 2, 3], call: 1 });
      expect(callCount).toBe(2);

      await sqlWithArrays.disconnect();
    });
  });

  describe("Edge cases for return values", () => {
    test("should cache null return values", async () => {
      let callCount = 0;
      const sqlWithNull = await SqlDataSource.connectToSecondarySource({
        type: "sqlite",
        database: ":memory:",
        logs: false,
        cacheStrategy: {
          cacheAdapter: new InMemoryAdapter(),
          keys: {
            nullReturner: async () => {
              callCount++;
              return null;
            },
          },
        },
      });

      const first = await sqlWithNull.useCache("nullReturner");
      const second = await sqlWithNull.useCache("nullReturner");

      expect(first).toBeNull();
      expect(second).toBeNull();
      expect(callCount).toBe(1);

      await sqlWithNull.disconnect();
    });

    test("should cache empty string return values", async () => {
      let callCount = 0;
      const sqlWithEmpty = await SqlDataSource.connectToSecondarySource({
        type: "sqlite",
        database: ":memory:",
        logs: false,
        cacheStrategy: {
          cacheAdapter: new InMemoryAdapter(),
          keys: {
            emptyString: async () => {
              callCount++;
              return "";
            },
          },
        },
      });

      const first = await sqlWithEmpty.useCache("emptyString");
      const second = await sqlWithEmpty.useCache("emptyString");

      expect(first).toBe("");
      expect(second).toBe("");
      expect(callCount).toBe(1);

      await sqlWithEmpty.disconnect();
    });

    test("should cache zero return values", async () => {
      let callCount = 0;
      const sqlWithZero = await SqlDataSource.connectToSecondarySource({
        type: "sqlite",
        database: ":memory:",
        logs: false,
        cacheStrategy: {
          cacheAdapter: new InMemoryAdapter(),
          keys: {
            zeroReturner: async () => {
              callCount++;
              return 0;
            },
          },
        },
      });

      const first = await sqlWithZero.useCache("zeroReturner");
      const second = await sqlWithZero.useCache("zeroReturner");

      expect(first).toBe(0);
      expect(second).toBe(0);
      expect(callCount).toBe(1);

      await sqlWithZero.disconnect();
    });

    test("should cache false return values", async () => {
      let callCount = 0;
      const sqlWithFalse = await SqlDataSource.connectToSecondarySource({
        type: "sqlite",
        database: ":memory:",
        logs: false,
        cacheStrategy: {
          cacheAdapter: new InMemoryAdapter(),
          keys: {
            falseReturner: async () => {
              callCount++;
              return false;
            },
          },
        },
      });

      const first = await sqlWithFalse.useCache("falseReturner");
      const second = await sqlWithFalse.useCache("falseReturner");

      expect(first).toBe(false);
      expect(second).toBe(false);
      expect(callCount).toBe(1);

      await sqlWithFalse.disconnect();
    });

    test("should cache empty array return values", async () => {
      let callCount = 0;
      const sqlWithEmptyArray = await SqlDataSource.connectToSecondarySource({
        type: "sqlite",
        database: ":memory:",
        logs: false,
        cacheStrategy: {
          cacheAdapter: new InMemoryAdapter(),
          keys: {
            emptyArray: async () => {
              callCount++;
              return [];
            },
          },
        },
      });

      const first = await sqlWithEmptyArray.useCache("emptyArray");
      const second = await sqlWithEmptyArray.useCache("emptyArray");

      expect(first).toEqual([]);
      expect(second).toEqual([]);
      expect(callCount).toBe(1);

      await sqlWithEmptyArray.disconnect();
    });

    test("should cache empty object return values", async () => {
      let callCount = 0;
      const sqlWithEmptyObj = await SqlDataSource.connectToSecondarySource({
        type: "sqlite",
        database: ":memory:",
        logs: false,
        cacheStrategy: {
          cacheAdapter: new InMemoryAdapter(),
          keys: {
            emptyObject: async () => {
              callCount++;
              return {};
            },
          },
        },
      });

      const first = await sqlWithEmptyObj.useCache("emptyObject");
      const second = await sqlWithEmptyObj.useCache("emptyObject");

      expect(first).toEqual({});
      expect(second).toEqual({});
      expect(callCount).toBe(1);

      await sqlWithEmptyObj.disconnect();
    });
  });

  describe("Clone behavior with cache", () => {
    test("should clone cache adapter and keys to cloned instance", async () => {
      let callCount = 0;
      const original = await SqlDataSource.connectToSecondarySource({
        type: "sqlite",
        database: ":memory:",
        logs: false,
        cacheStrategy: {
          cacheAdapter: new InMemoryAdapter(),
          keys: {
            cloneTest: async () => {
              callCount++;
              return `call-${callCount}`;
            },
          },
        },
      });

      const cloned = await original.clone();

      const originalResult = await original.useCache("cloneTest");
      const clonedResult = await cloned.useCache("cloneTest");

      expect(originalResult).toBe("call-1");
      expect(clonedResult).toBe("call-1");
      expect(callCount).toBe(1);

      await original.disconnect();
      await cloned.disconnect();
    });
  });

  describe("useConnection with cache", () => {
    test("should support cache operations within useConnection", async () => {
      let callCount = 0;

      await SqlDataSource.useConnection(
        {
          type: "sqlite",
          database: ":memory:",
          logs: false,
          cacheStrategy: {
            cacheAdapter: new InMemoryAdapter(),
            keys: {
              useConnectionTest: async () => {
                callCount++;
                return `call-${callCount}`;
              },
            },
          },
        },
        async (sql) => {
          const first = await sql.useCache("useConnectionTest");
          const second = await sql.useCache("useConnectionTest");

          expect(first).toBe("call-1");
          expect(second).toBe("call-1");
          expect(callCount).toBe(1);
        },
      );
    });
  });

  describe("Multiple cache keys", () => {
    test("should handle multiple different cache keys independently", async () => {
      let key1Count = 0;
      let key2Count = 0;

      const sqlMultiKey = await SqlDataSource.connectToSecondarySource({
        type: "sqlite",
        database: ":memory:",
        logs: false,
        cacheStrategy: {
          cacheAdapter: new InMemoryAdapter(),
          keys: {
            key1: async () => {
              key1Count++;
              return `key1-${key1Count}`;
            },
            key2: async () => {
              key2Count++;
              return `key2-${key2Count}`;
            },
          },
        },
      });

      const k1First = await sqlMultiKey.useCache("key1");
      const k2First = await sqlMultiKey.useCache("key2");
      const k1Second = await sqlMultiKey.useCache("key1");
      const k2Second = await sqlMultiKey.useCache("key2");

      expect(k1First).toBe("key1-1");
      expect(k2First).toBe("key2-1");
      expect(k1Second).toBe("key1-1");
      expect(k2Second).toBe("key2-1");
      expect(key1Count).toBe(1);
      expect(key2Count).toBe(1);

      await sqlMultiKey.invalidCache("key1");
      const k1AfterInvalidate = await sqlMultiKey.useCache("key1");
      const k2AfterInvalidate = await sqlMultiKey.useCache("key2");

      expect(k1AfterInvalidate).toBe("key1-2");
      expect(k2AfterInvalidate).toBe("key2-1");
      expect(key1Count).toBe(2);
      expect(key2Count).toBe(1);

      await sqlMultiKey.disconnect();
    });
  });

  describe("TTL edge cases", () => {
    test("should handle TTL of 0 as no TTL", async () => {
      let callCount = 0;
      const sqlZeroTTL = await SqlDataSource.connectToSecondarySource({
        type: "sqlite",
        database: ":memory:",
        logs: false,
        cacheStrategy: {
          cacheAdapter: new InMemoryAdapter(),
          keys: {
            zeroTTL: async () => {
              callCount++;
              return `call-${callCount}`;
            },
          },
        },
      });

      const first = await sqlZeroTTL.useCache("zeroTTL", 0);
      await new Promise((resolve) => setTimeout(resolve, 50));
      const second = await sqlZeroTTL.useCache("zeroTTL", 0);

      expect(first).toBe("call-1");
      expect(second).toBe("call-1");
      expect(callCount).toBe(1);

      await sqlZeroTTL.disconnect();
    });

    test("should handle very short TTL correctly", async () => {
      let callCount = 0;
      const sqlShortTTL = await SqlDataSource.connectToSecondarySource({
        type: "sqlite",
        database: ":memory:",
        logs: false,
        cacheStrategy: {
          cacheAdapter: new InMemoryAdapter(),
          keys: {
            shortTTL: async () => {
              callCount++;
              return `call-${callCount}`;
            },
          },
        },
      });

      const first = await sqlShortTTL.useCache("shortTTL", 10);
      expect(first).toBe("call-1");

      await new Promise((resolve) => setTimeout(resolve, 50));

      const second = await sqlShortTTL.useCache("shortTTL", 10);
      expect(second).toBe("call-2");
      expect(callCount).toBe(2);

      await sqlShortTTL.disconnect();
    });
  });

  describe("Handler with multiple parameters and TTL", () => {
    test("should correctly distinguish TTL from first handler argument", async () => {
      let callCount = 0;
      const sqlMultiParam = await SqlDataSource.connectToSecondarySource({
        type: "sqlite",
        database: ":memory:",
        logs: false,
        cacheStrategy: {
          cacheAdapter: new InMemoryAdapter(),
          keys: {
            multiParam: async (a: number, b: number, c: string) => {
              callCount++;
              return { a, b, c, call: callCount };
            },
          },
        },
      });

      const withoutTTL = await sqlMultiParam.useCache(
        "multiParam",
        1,
        2,
        "test",
      );
      expect(withoutTTL).toEqual({ a: 1, b: 2, c: "test", call: 1 });

      await sqlMultiParam.invalidCache("multiParam");

      const withTTL = await sqlMultiParam.useCache(
        "multiParam",
        5000,
        10,
        20,
        "ttl-test",
      );
      expect(withTTL).toEqual({ a: 10, b: 20, c: "ttl-test", call: 2 });

      await sqlMultiParam.disconnect();
    });
  });

  describe("Error propagation from handlers", () => {
    test("should propagate errors from cache handlers", async () => {
      const sqlWithError = await SqlDataSource.connectToSecondarySource({
        type: "sqlite",
        database: ":memory:",
        logs: false,
        cacheStrategy: {
          cacheAdapter: new InMemoryAdapter(),
          keys: {
            errorHandler: async () => {
              throw new Error("Handler error");
            },
          },
        },
      });

      await expect(sqlWithError.useCache("errorHandler")).rejects.toThrow(
        "Handler error",
      );

      await sqlWithError.disconnect();
    });

    test("should not cache values when handler throws error", async () => {
      let callCount = 0;
      const sqlWithConditionalError =
        await SqlDataSource.connectToSecondarySource({
          type: "sqlite",
          database: ":memory:",
          logs: false,
          cacheStrategy: {
            cacheAdapter: new InMemoryAdapter(),
            keys: {
              conditionalError: async () => {
                callCount++;
                if (callCount === 1) {
                  throw new Error("First call error");
                }
                return `call-${callCount}`;
              },
            },
          },
        });

      await expect(
        sqlWithConditionalError.useCache("conditionalError"),
      ).rejects.toThrow("First call error");

      const result = await sqlWithConditionalError.useCache("conditionalError");
      expect(result).toBe("call-2");
      expect(callCount).toBe(2);

      await sqlWithConditionalError.disconnect();
    });
  });
});
