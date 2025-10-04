import { RedisDataSource } from "../../src/no_sql/redis/redis_data_source";

let redisInstance: RedisDataSource;
describe("RedisDataSource", () => {
  beforeAll(async () => {
    await RedisDataSource.connect({
      host: "localhost",
      port: 6379,
      username: "default",
      password: "root",
      db: 0,
    });

    redisInstance = await RedisDataSource.getConnection({
      host: "localhost",
      port: 6379,
      username: "default",
      password: "password",
      db: 0,
    });
  });

  afterAll(async () => {
    await redisInstance.disconnect();
    await RedisDataSource.disconnect();
  });

  // Test singleton static class
  test("redis static isConnected check", async () => {
    expect(RedisDataSource.isConnected).toBe(true);
  });

  test("redis static string operations", async () => {
    await RedisDataSource.set("key", "value", 1000);
    const value = await RedisDataSource.get<string | null>("key");
    expect(value).toBe("value");

    await RedisDataSource.delete("key");
    const deletedValue = await RedisDataSource.get<string>("key");
    expect(deletedValue).toBe(null);
  });

  test("redis static object operations", async () => {
    await RedisDataSource.set("key", { key: "value" }, 1000);
    const objectValue = await RedisDataSource.get<{ key: string }>("key");
    expect(objectValue).toEqual({ key: "value" });

    await RedisDataSource.delete("key");
    const deletedObjectValue = await RedisDataSource.get<{ key: string }>(
      "key",
    );
    expect(deletedObjectValue).toBe(null);
  });

  test("redis static buffer operations", async () => {
    await RedisDataSource.set("key", Buffer.from("value"), 10000);
    const bufferValue = await RedisDataSource.getBuffer("key");
    expect(bufferValue).toEqual(Buffer.from("value"));

    await RedisDataSource.delete("key");
    const deletedBufferValue = await RedisDataSource.get<Buffer>("key");
    expect(deletedBufferValue).toBe(null);
  });

  test("redis static number operations", async () => {
    await RedisDataSource.set("key", 1, 1000);
    const numberValue = await RedisDataSource.get<number>("key");
    expect(numberValue).toBe(1);

    await RedisDataSource.delete("key");
    const deletedNumberValue = await RedisDataSource.get<number>("key");
    expect(deletedNumberValue).toBe(null);
  });

  test("redis static boolean operations", async () => {
    await RedisDataSource.set("key", true, 1000);
    const booleanValue = await RedisDataSource.get<boolean>("key");
    expect(booleanValue).toBe(true);

    await RedisDataSource.delete("key");
    const deletedBooleanValue = await RedisDataSource.get<boolean>("key");
    expect(deletedBooleanValue).toBe(null);
  });

  test("redis static array operations", async () => {
    await RedisDataSource.set("key", [1, 2, 3], 1000);
    const arrayValue = await RedisDataSource.get<number[]>("key");
    expect(arrayValue).toEqual([1, 2, 3]);

    await RedisDataSource.delete("key");
    const deletedArrayValue = await RedisDataSource.get<number[]>("key");
    expect(deletedArrayValue).toBe(null);
  });

  // Test instance class
  test("redis instance isConnected check", async () => {
    expect(redisInstance.isConnected).toBe(true);
  });

  test("redis instance string operations", async () => {
    await redisInstance.set("key", "value", 1000);
    const value = await redisInstance.get<string>("key");
    expect(value).toBe("value");

    await redisInstance.delete("key");
    const deletedValue = await redisInstance.get<string>("key");
    expect(deletedValue).toBe(null);
  });

  test("redis instance object operations", async () => {
    await redisInstance.set("key", { key: "value" }, 1000);
    const objectValue = await redisInstance.get<{ key: string }>("key");
    expect(objectValue).toEqual({ key: "value" });

    await redisInstance.delete("key");
    const deletedObjectValue = await redisInstance.get<{ key: string }>("key");
    expect(deletedObjectValue).toBe(null);
  });

  test("redis instance buffer operations", async () => {
    await redisInstance.set("key", Buffer.from("value"), 6000);
    const bufferValue = await RedisDataSource.getBuffer("key");
    expect(bufferValue).toEqual(Buffer.from("value"));

    await redisInstance.delete("key");
    const deletedBufferValue = await redisInstance.get<Buffer>("key");
    expect(deletedBufferValue).toBe(null);
  });

  test("redis instance number operations", async () => {
    await redisInstance.set("key", 1, 1000);
    const numberValue = await redisInstance.get<number>("key");
    expect(numberValue).toBe(1);

    await redisInstance.delete("key");
    const deletedNumberValue = await redisInstance.get<number>("key");
    expect(deletedNumberValue).toBe(null);
  });

  test("redis instance boolean operations", async () => {
    await redisInstance.set("key", true, 1000);
    const booleanValue = await redisInstance.get<boolean>("key");
    expect(booleanValue).toBe(true);

    await redisInstance.delete("key");
    const deletedBooleanValue = await redisInstance.get<boolean>("key");
    expect(deletedBooleanValue).toBe(null);
  });

  test("redis instance array operations", async () => {
    await redisInstance.set("key", [1, 2, 3], 1000);
    const arrayValue = await redisInstance.get<number[]>("key");
    expect(arrayValue).toEqual([1, 2, 3]);

    await redisInstance.delete("key");
    const deletedArrayValue = await redisInstance.get<number[]>("key");
    expect(deletedArrayValue).toBe(null);
  });

  test("should expire key and get null", async () => {
    await redisInstance.set("key", "value", 1000);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const value = await redisInstance.get<string>("key");
    expect(value).toBe(null);
  });

  // List operations tests
  describe("List Operations", () => {
    beforeEach(async () => {
      await RedisDataSource.delete("testlist");
    });

    test("redis static list operations", async () => {
      await RedisDataSource.lpush("testlist", "item1", "item2");
      await RedisDataSource.rpush("testlist", "item3");

      const length = await RedisDataSource.llen("testlist");
      expect(length).toBe(3);

      const range = await RedisDataSource.lrange<string>("testlist", 0, -1);
      expect(range).toEqual(["item2", "item1", "item3"]);

      const firstPop = await RedisDataSource.lpop<string>("testlist");
      expect(firstPop).toBe("item2");

      const lastPop = await RedisDataSource.rpop<string>("testlist");
      expect(lastPop).toBe("item3");
    });

    test("redis instance list operations", async () => {
      await redisInstance.lpush("testlist", "item1", "item2");
      await redisInstance.rpush("testlist", "item3");

      const length = await redisInstance.llen("testlist");
      expect(length).toBe(3);

      const range = await redisInstance.lrange<string>("testlist", 0, -1);
      expect(range).toEqual(["item2", "item1", "item3"]);

      const firstPop = await redisInstance.lpop<string>("testlist");
      expect(firstPop).toBe("item2");

      const lastPop = await redisInstance.rpop<string>("testlist");
      expect(lastPop).toBe("item3");
    });
  });

  // Hash operations tests
  describe("Hash Operations", () => {
    beforeEach(async () => {
      await RedisDataSource.delete("testhash");
    });

    test("redis static hash operations", async () => {
      await RedisDataSource.hset("testhash", "field1", "value1");
      const value1 = await RedisDataSource.hget<string>("testhash", "field1");
      expect(value1).toBe("value1");

      await RedisDataSource.hmset("testhash", {
        field2: "value2",
        field3: 123,
        field4: { nested: true },
      });

      const allFields = await RedisDataSource.hgetall<string | number | object>(
        "testhash",
      );
      expect(allFields).toEqual({
        field1: "value1",
        field2: "value2",
        field3: 123,
        field4: { nested: true },
      });

      const multiGet = await RedisDataSource.hmget<string | number>(
        "testhash",
        "field1",
        "field3",
      );
      expect(multiGet).toEqual(["value1", 123]);

      const exists = await RedisDataSource.hexists("testhash", "field1");
      expect(exists).toBe(1);

      const keys = await RedisDataSource.hkeys("testhash");
      expect(keys.length).toBe(4);
      expect(keys.sort()).toEqual(
        ["field1", "field2", "field3", "field4"].sort(),
      );

      const len = await RedisDataSource.hlen("testhash");
      expect(len).toBe(4);

      const deleted = await RedisDataSource.hdel(
        "testhash",
        "field1",
        "field2",
      );
      expect(deleted).toBe(2);

      const afterDelete = await RedisDataSource.hgetall<string>("testhash");
      expect(Object.keys(afterDelete).length).toBe(2);
    });

    test("redis instance hash operations", async () => {
      await redisInstance.hset("testhash", "field1", "value1");
      const value1 = await redisInstance.hget<string>("testhash", "field1");
      expect(value1).toBe("value1");

      await redisInstance.hmset("testhash", {
        field2: "value2",
        field3: 123,
        field4: { nested: true },
      });

      const allFields = await redisInstance.hgetall<string | number | object>(
        "testhash",
      );
      expect(allFields).toEqual({
        field1: "value1",
        field2: "value2",
        field3: 123,
        field4: { nested: true },
      });

      const multiGet = await redisInstance.hmget<string | number>(
        "testhash",
        "field1",
        "field3",
      );
      expect(multiGet).toEqual(["value1", 123]);

      const exists = await redisInstance.hexists("testhash", "field1");
      expect(exists).toBe(1);

      const keys = await redisInstance.hkeys("testhash");
      expect(keys.length).toBe(4);
      expect(keys.sort()).toEqual(
        ["field1", "field2", "field3", "field4"].sort(),
      );

      const len = await redisInstance.hlen("testhash");
      expect(len).toBe(4);

      const deleted = await redisInstance.hdel("testhash", "field1", "field2");
      expect(deleted).toBe(2);

      const afterDelete = await redisInstance.hgetall<string>("testhash");
      expect(Object.keys(afterDelete).length).toBe(2);
    });
  });

  // Set operations tests
  describe("Set Operations", () => {
    beforeEach(async () => {
      await RedisDataSource.delete("testset1");
      await RedisDataSource.delete("testset2");
      await RedisDataSource.delete("testset3");
    });

    test("redis static set operations", async () => {
      await RedisDataSource.sadd("testset1", "a", "b", "c");
      await RedisDataSource.sadd("testset2", "b", "c", "d");
      await RedisDataSource.sadd("testset3", "c", "d", "e");

      const members = await RedisDataSource.smembers<string>("testset1");
      expect(members.sort()).toEqual(["a", "b", "c"].sort());

      const isMember = await RedisDataSource.sismember("testset1", "a");
      expect(isMember).toBe(1);

      const notMember = await RedisDataSource.sismember("testset1", "z");
      expect(notMember).toBe(0);

      const cardinality = await RedisDataSource.scard("testset1");
      expect(cardinality).toBe(3);

      const intersection = await RedisDataSource.sinter<string>(
        "testset1",
        "testset2",
      );
      expect(intersection.sort()).toEqual(["b", "c"].sort());

      const union = await RedisDataSource.sunion<string>(
        "testset1",
        "testset3",
      );
      expect(union.sort()).toEqual(["a", "b", "c", "d", "e"].sort());

      const difference = await RedisDataSource.sdiff<string>(
        "testset1",
        "testset2",
      );
      expect(difference).toEqual(["a"]);

      const removed = await RedisDataSource.srem("testset1", "a", "b");
      expect(removed).toBe(2);

      const afterRemove = await RedisDataSource.smembers<string>("testset1");
      expect(afterRemove).toEqual(["c"]);
    });

    test("redis instance set operations", async () => {
      await redisInstance.sadd("testset1", "a", "b", "c");
      await redisInstance.sadd("testset2", "b", "c", "d");
      await redisInstance.sadd("testset3", "c", "d", "e");

      const members = await redisInstance.smembers<string>("testset1");
      expect(members.sort()).toEqual(["a", "b", "c"].sort());

      const isMember = await redisInstance.sismember("testset1", "a");
      expect(isMember).toBe(1);

      const notMember = await redisInstance.sismember("testset1", "z");
      expect(notMember).toBe(0);

      const cardinality = await redisInstance.scard("testset1");
      expect(cardinality).toBe(3);

      const intersection = await redisInstance.sinter<string>(
        "testset1",
        "testset2",
      );
      expect(intersection.sort()).toEqual(["b", "c"].sort());

      const union = await redisInstance.sunion<string>("testset1", "testset3");
      expect(union.sort()).toEqual(["a", "b", "c", "d", "e"].sort());

      const difference = await redisInstance.sdiff<string>(
        "testset1",
        "testset2",
      );
      expect(difference).toEqual(["a"]);

      const removed = await redisInstance.srem("testset1", "a", "b");
      expect(removed).toBe(2);

      const afterRemove = await redisInstance.smembers<string>("testset1");
      expect(afterRemove).toEqual(["c"]);
    });
  });

  // Sorted Set operations tests
  describe("Sorted Set Operations", () => {
    beforeEach(async () => {
      await RedisDataSource.delete("testzset");
    });

    test("redis static sorted set operations", async () => {
      await RedisDataSource.zadd("testzset", 1, "one");
      await RedisDataSource.zadd("testzset", 2, "two");
      await RedisDataSource.zadd("testzset", 3, "three");

      const score = await RedisDataSource.zscore("testzset", "two");
      expect(score).toBe(2);

      const range = await RedisDataSource.zrange<string>("testzset", 0, -1);
      expect(range).toEqual(["one", "two", "three"]);

      const rangeWithScores = await RedisDataSource.zrange<string>(
        "testzset",
        0,
        -1,
        true,
      );
      expect(rangeWithScores).toEqual([
        { value: "one", score: 1 },
        { value: "two", score: 2 },
        { value: "three", score: 3 },
      ]);

      const reverseRange = await RedisDataSource.zrevrange<string>(
        "testzset",
        0,
        -1,
      );
      expect(reverseRange).toEqual(["three", "two", "one"]);

      const count = await RedisDataSource.zcard("testzset");
      expect(count).toBe(3);

      const removed = await RedisDataSource.zrem("testzset", "one");
      expect(removed).toBe(1);

      const afterRemove = await RedisDataSource.zrange<string>(
        "testzset",
        0,
        -1,
      );
      expect(afterRemove).toEqual(["two", "three"]);

      // Batch zadd
      await RedisDataSource.zadd("testzset", [
        [4, "four"],
        [5, "five"],
      ]);
      const afterBatch = await RedisDataSource.zrange<string>(
        "testzset",
        0,
        -1,
      );
      expect(afterBatch).toEqual(["two", "three", "four", "five"]);
    });

    test("redis instance sorted set operations", async () => {
      await redisInstance.zadd("testzset", 1, "one");
      await redisInstance.zadd("testzset", 2, "two");
      await redisInstance.zadd("testzset", 3, "three");

      const score = await redisInstance.zscore("testzset", "two");
      expect(score).toBe(2);

      const range = await redisInstance.zrange<string>("testzset", 0, -1);
      expect(range).toEqual(["one", "two", "three"]);

      const rangeWithScores = await redisInstance.zrange<string>(
        "testzset",
        0,
        -1,
        true,
      );
      expect(rangeWithScores).toEqual([
        { value: "one", score: 1 },
        { value: "two", score: 2 },
        { value: "three", score: 3 },
      ]);

      const reverseRange = await redisInstance.zrevrange<string>(
        "testzset",
        0,
        -1,
      );
      expect(reverseRange).toEqual(["three", "two", "one"]);

      const count = await redisInstance.zcard("testzset");
      expect(count).toBe(3);

      const removed = await redisInstance.zrem("testzset", "one");
      expect(removed).toBe(1);

      const afterRemove = await redisInstance.zrange<string>("testzset", 0, -1);
      expect(afterRemove).toEqual(["two", "three"]);

      // Batch zadd
      await redisInstance.zadd("testzset", [
        [4, "four"],
        [5, "five"],
      ]);
      const afterBatch = await redisInstance.zrange<string>("testzset", 0, -1);
      expect(afterBatch).toEqual(["two", "three", "four", "five"]);
    });
  });

  // Key operations tests
  describe("Key Operations", () => {
    beforeEach(async () => {
      await RedisDataSource.delete("testkey");
      await RedisDataSource.delete("testkey2");
    });

    test("redis static key operations", async () => {
      // Set up test keys
      await RedisDataSource.set("testkey", "value");

      // Test exists
      const exists = await RedisDataSource.exists("testkey");
      expect(exists).toBe(1);

      const notExists = await RedisDataSource.exists("nonexistent");
      expect(notExists).toBe(0);

      // Test expire
      await RedisDataSource.expire("testkey", 3600);
      const ttl = await RedisDataSource.ttl("testkey");
      expect(ttl).toBeGreaterThan(0);

      // Test persist
      await RedisDataSource.persist("testkey");
      const persistedTtl = await RedisDataSource.ttl("testkey");
      expect(persistedTtl).toBe(-1); // No expiration

      // Test type
      const type = await RedisDataSource.type("testkey");
      expect(type).toBe("string");

      // Test rename
      await RedisDataSource.rename("testkey", "testkey2");
      const existsAfterRename = await RedisDataSource.exists("testkey");
      expect(existsAfterRename).toBe(0);
      const existsNew = await RedisDataSource.exists("testkey2");
      expect(existsNew).toBe(1);

      // Test milliseconds expiration
      await RedisDataSource.set("testkey", "value");
      await RedisDataSource.pexpire("testkey", 3600000);
      const pttl = await RedisDataSource.pttl("testkey");
      expect(pttl).toBeGreaterThan(0);

      // Test expireat (using current time + 1 hour)
      await RedisDataSource.set("testkey", "value");
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
      await RedisDataSource.expireat("testkey", futureTimestamp);
      const ttlExpireAt = await RedisDataSource.ttl("testkey");
      expect(ttlExpireAt).toBeGreaterThan(0);

      // Create a bunch of keys for pattern matching
      await RedisDataSource.set("prefix:key1", "value1");
      await RedisDataSource.set("prefix:key2", "value2");
      await RedisDataSource.set("prefix:key3", "value3");

      // Test keys
      const keys = await RedisDataSource.keys("prefix:*");
      expect(keys.length).toBe(3);
      expect(keys.every((k) => k.startsWith("prefix:"))).toBe(true);
    });

    test("redis instance key operations", async () => {
      // Set up test keys
      await redisInstance.set("testkey", "value");

      // Test exists
      const exists = await redisInstance.exists("testkey");
      expect(exists).toBe(1);

      const notExists = await redisInstance.exists("nonexistent");
      expect(notExists).toBe(0);

      // Test expire
      await redisInstance.expire("testkey", 3600);
      const ttl = await redisInstance.ttl("testkey");
      expect(ttl).toBeGreaterThan(0);

      // Test persist
      await redisInstance.persist("testkey");
      const persistedTtl = await redisInstance.ttl("testkey");
      expect(persistedTtl).toBe(-1); // No expiration

      // Test type
      const type = await redisInstance.type("testkey");
      expect(type).toBe("string");

      // Test rename
      await redisInstance.rename("testkey", "testkey2");
      const existsAfterRename = await redisInstance.exists("testkey");
      expect(existsAfterRename).toBe(0);
      const existsNew = await redisInstance.exists("testkey2");
      expect(existsNew).toBe(1);

      // Test milliseconds expiration
      await redisInstance.set("testkey", "value");
      await redisInstance.pexpire("testkey", 3600000);
      const pttl = await redisInstance.pttl("testkey");
      expect(pttl).toBeGreaterThan(0);

      // Test expireat (using current time + 1 hour)
      await redisInstance.set("testkey", "value");
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
      await redisInstance.expireat("testkey", futureTimestamp);
      const ttlExpireAt = await redisInstance.ttl("testkey");
      expect(ttlExpireAt).toBeGreaterThan(0);

      // Create a bunch of keys for pattern matching
      await redisInstance.set("prefix:key1", "value1");
      await redisInstance.set("prefix:key2", "value2");
      await redisInstance.set("prefix:key3", "value3");

      // Test keys
      const keys = await redisInstance.keys("prefix:*");
      expect(keys.length).toBe(3);
      expect(keys.every((k) => k.startsWith("prefix:"))).toBe(true);
    });
  });

  // Publish/Subscribe tests
  describe("Publish/Subscribe Operations", () => {
    let subscriber: RedisDataSource;

    beforeAll(async () => {
      subscriber = await RedisDataSource.getConnection({
        host: "localhost",
        port: 6379,
        username: "default",
        password: "root",
      });
    });

    afterAll(async () => {
      await subscriber.disconnect();
    });

    test("publish and subscribe", async () => {
      const channelName = "testchannel";
      const testMessage = "Hello Redis PubSub";

      // Set up a promise to resolve when the message is received
      const messageReceived = new Promise<{ channel: string; message: string }>(
        (resolve) => {
          subscriber.subscribe([channelName], (channel, message) => {
            resolve({ channel, message });
          });
        },
      );

      // Wait a bit for the subscription to be established
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Publish a message
      const receivers = await redisInstance.publish(channelName, testMessage);
      expect(receivers).toBeGreaterThanOrEqual(1);

      // Wait for the message to be received
      const received = await messageReceived;
      expect(received.channel).toBe(channelName);
      expect(received.message).toBe(testMessage);

      // Unsubscribe
      await subscriber.unsubscribe(channelName);
    });

    test("pattern subscribe", async () => {
      const pattern = "test:*";
      const channelName = "test:channel1";
      const testMessage = "Hello Redis Pattern PubSub";

      // Set up a promise to resolve when the message is received
      const messageReceived = new Promise<{ channel: string; message: string }>(
        (resolve) => {
          subscriber.psubscribe([pattern], (channel, message) => {
            resolve({ channel, message });
          });
        },
      );

      // Wait a bit for the subscription to be established
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Publish a message
      const receivers = await redisInstance.publish(channelName, testMessage);
      expect(receivers).toBeGreaterThanOrEqual(1);

      // Wait for the message to be received
      const received = await messageReceived;
      expect(received.channel).toBe(channelName);
      expect(received.message).toBe(testMessage);

      // Unsubscribe from pattern
      await subscriber.punsubscribe(pattern);
    });
  });
});
