import { RedisDataSource } from "../../src/no_sql/redis/redis_data_source";

const redisConfig = {
  host: "localhost",
  port: 6379,
  username: "default",
  password: "root",
  db: 0,
};

let redis: RedisDataSource;

describe("RedisDataSource", () => {
  beforeAll(async () => {
    redis = new RedisDataSource(redisConfig);
    await redis.connect();
  });

  afterAll(async () => {
    await redis.flushAll();
    await redis.disconnect();
  });

  test("isConnected check", async () => {
    expect(redis.isConnected).toBe(true);
  });

  test("string operations", async () => {
    await redis.set("key", "value", 1000);
    const value = await redis.get<string | null>("key");
    expect(value).toBe("value");

    await redis.delete("key");
    const deletedValue = await redis.get<string>("key");
    expect(deletedValue).toBeNull();
  });

  test("object operations", async () => {
    await redis.set("key", { key: "value" }, 1000);
    const objectValue = await redis.get<{ key: string }>("key");
    expect(objectValue).toEqual({ key: "value" });

    await redis.delete("key");
    const deletedObjectValue = await redis.get<{ key: string }>("key");
    expect(deletedObjectValue).toBeNull();
  });

  test("buffer operations", async () => {
    await redis.set("key", Buffer.from("value"), 6000);
    const bufferValue = await redis.getBuffer("key");
    expect(bufferValue).toEqual(Buffer.from("value"));

    await redis.delete("key");
    const deletedBufferValue = await redis.get<Buffer>("key");
    expect(deletedBufferValue).toBeNull();
  });

  test("number operations", async () => {
    await redis.set("key", 1, 1000);
    const numberValue = await redis.get<number>("key");
    expect(numberValue).toBe(1);

    await redis.delete("key");
    const deletedNumberValue = await redis.get<number>("key");
    expect(deletedNumberValue).toBeNull();
  });

  test("boolean operations", async () => {
    await redis.set("key", true, 1000);
    const booleanValue = await redis.get<boolean>("key");
    expect(booleanValue).toBe(true);

    await redis.delete("key");
    const deletedBooleanValue = await redis.get<boolean>("key");
    expect(deletedBooleanValue).toBeNull();
  });

  test("array operations", async () => {
    await redis.set("key", [1, 2, 3], 1000);
    const arrayValue = await redis.get<number[]>("key");
    expect(arrayValue).toEqual([1, 2, 3]);

    await redis.delete("key");
    const deletedArrayValue = await redis.get<number[]>("key");
    expect(deletedArrayValue).toBeNull();
  });

  test("should expire key and get null", async () => {
    await redis.set("key", "value", 2000);
    const value = await redis.get<string>("key");
    expect(value).toBe("value");
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const expiredValue = await redis.get<string>("key");
    expect(expiredValue).toBeNull();
  });

  describe("List Operations", () => {
    afterEach(async () => {
      await redis.delete("list");
    });

    test("list operations", async () => {
      await redis.lpush("list", "a", "b", "c");
      const len = await redis.llen("list");
      expect(len).toBe(3);

      const range = await redis.lrange<string>("list", 0, -1);
      expect(range).toEqual(["c", "b", "a"]);

      const lpopValue = await redis.lpop<string>("list");
      expect(lpopValue).toBe("c");

      const rpopValue = await redis.rpop<string>("list");
      expect(rpopValue).toBe("a");
    });

    test("rpush and lrange", async () => {
      await redis.rpush("list", "x", "y", "z");
      const range = await redis.lrange<string>("list", 0, -1);
      expect(range).toEqual(["x", "y", "z"]);
    });
  });

  describe("Hash Operations", () => {
    afterEach(async () => {
      await redis.delete("hash");
    });

    test("hash operations", async () => {
      await redis.hset("hash", "field1", "value1");
      const value = await redis.hget<string>("hash", "field1");
      expect(value).toBe("value1");

      await redis.hmset("hash", { field2: "value2", field3: "value3" });
      const allValues = await redis.hgetall<string>("hash");
      expect(allValues).toEqual({
        field1: "value1",
        field2: "value2",
        field3: "value3",
      });

      const multiGet = await redis.hmget<string>("hash", "field1", "field2");
      expect(multiGet).toEqual(["value1", "value2"]);

      const exists = await redis.hexists("hash", "field1");
      expect(exists).toBe(1);

      const keys = await redis.hkeys("hash");
      expect(keys.sort()).toEqual(["field1", "field2", "field3"]);

      const hlen = await redis.hlen("hash");
      expect(hlen).toBe(3);

      await redis.hdel("hash", "field1");
      const afterDel = await redis.hget<string>("hash", "field1");
      expect(afterDel).toBeNull();
    });
  });

  describe("Set Operations", () => {
    afterEach(async () => {
      await redis.delete("set1");
      await redis.delete("set2");
    });

    test("set operations", async () => {
      await redis.sadd("set1", "a", "b", "c");
      const members = await redis.smembers<string>("set1");
      expect(members.sort()).toEqual(["a", "b", "c"]);

      const isMember = await redis.sismember("set1", "a");
      expect(isMember).toBe(1);

      const card = await redis.scard("set1");
      expect(card).toBe(3);

      await redis.srem("set1", "a");
      const afterRem = await redis.smembers<string>("set1");
      expect(afterRem.sort()).toEqual(["b", "c"]);
    });

    test("set intersection, union, diff", async () => {
      await redis.sadd("set1", "a", "b", "c");
      await redis.sadd("set2", "b", "c", "d");

      const inter = await redis.sinter<string>("set1", "set2");
      expect(inter.sort()).toEqual(["b", "c"]);

      const union = await redis.sunion<string>("set1", "set2");
      expect(union.sort()).toEqual(["a", "b", "c", "d"]);

      const diff = await redis.sdiff<string>("set1", "set2");
      expect(diff).toEqual(["a"]);
    });
  });

  describe("Sorted Set Operations", () => {
    afterEach(async () => {
      await redis.delete("zset");
    });

    test("sorted set operations", async () => {
      await redis.zadd("zset", 1, "a");
      await redis.zadd("zset", 2, "b");
      await redis.zadd("zset", 3, "c");

      const range = await redis.zrange<string>("zset", 0, -1);
      expect(range).toEqual(["a", "b", "c"]);

      const rangeWithScores = await redis.zrange<string>("zset", 0, -1, true);
      expect(rangeWithScores).toEqual([
        { score: 1, value: "a" },
        { score: 2, value: "b" },
        { score: 3, value: "c" },
      ]);

      const revrange = await redis.zrevrange<string>("zset", 0, -1);
      expect(revrange).toEqual(["c", "b", "a"]);

      const score = await redis.zscore("zset", "b");
      expect(score).toBe(2);

      const card = await redis.zcard("zset");
      expect(card).toBe(3);

      await redis.zrem("zset", "a");
      const afterRem = await redis.zrange<string>("zset", 0, -1);
      expect(afterRem).toEqual(["b", "c"]);
    });

    test("sorted set bulk add", async () => {
      await redis.zadd("zset", [
        [1, "x"],
        [2, "y"],
        [3, "z"],
      ]);
      const range = await redis.zrange<string>("zset", 0, -1);
      expect(range).toEqual(["x", "y", "z"]);
    });
  });

  describe("Key Operations", () => {
    afterEach(async () => {
      await redis.delete("key_ops");
      await redis.delete("key_ops_renamed");
    });

    test("key operations", async () => {
      await redis.set("key_ops", "value");

      const exists = await redis.exists("key_ops");
      expect(exists).toBe(1);

      await redis.expire("key_ops", 100);
      const ttl = await redis.ttl("key_ops");
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(100);

      await redis.persist("key_ops");
      const ttlAfterPersist = await redis.ttl("key_ops");
      expect(ttlAfterPersist).toBe(-1);

      await redis.pexpire("key_ops", 100000);
      const pttl = await redis.pttl("key_ops");
      expect(pttl).toBeGreaterThan(0);

      const keyType = await redis.type("key_ops");
      expect(keyType).toBe("string");

      await redis.rename("key_ops", "key_ops_renamed");
      const renamedVal = await redis.get<string>("key_ops_renamed");
      expect(renamedVal).toBe("value");

      const keys = await redis.keys("key_ops*");
      expect(keys).toContain("key_ops_renamed");
    });

    test("expireat", async () => {
      await redis.set("key_ops", "value");
      const futureTimestamp = Math.floor(Date.now() / 1000) + 100;
      await redis.expireat("key_ops", futureTimestamp);
      const ttl = await redis.ttl("key_ops");
      expect(ttl).toBeGreaterThan(0);
    });
  });

  describe("Publish/Subscribe Operations", () => {
    let subscriber: RedisDataSource;

    beforeAll(async () => {
      subscriber = new RedisDataSource(redisConfig);
      await subscriber.connect();
    });

    afterAll(async () => {
      await subscriber.disconnect();
    });

    test("publish and subscribe", async () => {
      const messages: string[] = [];

      await subscriber.subscribe(["test-channel"], (_channel, message) => {
        messages.push(message);
      });

      // Give subscriber time to set up
      await new Promise((resolve) => setTimeout(resolve, 100));

      await redis.publish("test-channel", "hello");
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(messages).toContain("hello");

      await subscriber.unsubscribe("test-channel");
    });

    test("pattern subscribe", async () => {
      const messages: string[] = [];

      await subscriber.psubscribe(["test-*"], (_pattern, message) => {
        messages.push(message);
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      await redis.publish("test-pattern", "world");
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(messages).toContain("world");

      await subscriber.punsubscribe("test-*");
    });
  });

  describe("Connection", () => {
    test("lazyLoad false (default) throws when not connected", async () => {
      const notConnected = new RedisDataSource(redisConfig);
      await expect(notConnected.get("key")).rejects.toThrow();
    });

    test("lazyLoad true auto-connects on first command", async () => {
      const lazy = new RedisDataSource({ ...redisConfig, lazyLoad: true });
      expect(lazy.isConnected).toBe(false);

      // Should auto-connect and succeed
      await lazy.set("lazy_key", "lazy_value");
      expect(lazy.isConnected).toBe(true);

      const value = await lazy.get<string>("lazy_key");
      expect(value).toBe("lazy_value");

      await lazy.delete("lazy_key");
      await lazy.disconnect();
    });

    test("multiple instances are independent", async () => {
      const redis2 = new RedisDataSource(redisConfig);
      await redis2.connect();

      await redis.set("multi_key", "from_redis1");
      const val = await redis2.get<string>("multi_key");
      expect(val).toBe("from_redis1");

      await redis.delete("multi_key");
      await redis2.disconnect();
    });

    test("connect is idempotent", async () => {
      const r = new RedisDataSource(redisConfig);
      await r.connect();
      await r.connect(); // should not throw
      expect(r.isConnected).toBe(true);
      await r.disconnect();
    });

    test("disconnect on not connected is safe", async () => {
      const r = new RedisDataSource(redisConfig);
      await r.disconnect(); // should not throw
    });
  });

  describe("Consume", () => {
    test("consume returns value and deletes key", async () => {
      await redis.set("consume_key", "consume_value");
      const value = await redis.consume<string>("consume_key");
      expect(value).toBe("consume_value");

      const afterConsume = await redis.get<string>("consume_key");
      expect(afterConsume).toBeNull();
    });
  });

  describe("FlushAll", () => {
    test("flushAll clears all keys", async () => {
      await redis.set("flush1", "a");
      await redis.set("flush2", "b");
      await redis.flushAll();

      const v1 = await redis.get("flush1");
      const v2 = await redis.get("flush2");
      expect(v1).toBeNull();
      expect(v2).toBeNull();
    });
  });
});
