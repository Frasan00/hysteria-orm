import { RedisDataSource } from "../../src/no_sql/redis/redis_data_source";

let redisInstance: RedisDataSource;
describe("RedisDataSource", () => {
  beforeAll(async () => {
    await RedisDataSource.connect({
      host: "localhost",
      port: 6379,
      username: "default",
      password: "root",
    });

    redisInstance = await RedisDataSource.getConnection({
      host: "localhost",
      port: 6379,
      username: "default",
      password: "password",
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
    RedisDataSource.set("key", "value", 1000);
    const value = await RedisDataSource.get<string | null>("key");
    expect(value).toBe("value");

    await RedisDataSource.delete("key");
    const deletedValue = await RedisDataSource.get<string>("key");
    expect(deletedValue).toBe(null);
  });

  test("redis static object operations", async () => {
    RedisDataSource.set("key", { key: "value" }, 1000);
    const objectValue = await RedisDataSource.get<{ key: string }>("key");
    expect(objectValue).toEqual({ key: "value" });

    await RedisDataSource.delete("key");
    const deletedObjectValue = await RedisDataSource.get<{ key: string }>(
      "key",
    );
    expect(deletedObjectValue).toBe(null);
  });

  test("redis static buffer operations", async () => {
    RedisDataSource.set("key", Buffer.from("value"), 10000);
    const bufferValue = await RedisDataSource.getBuffer("key");
    expect(bufferValue).toEqual(Buffer.from("value"));

    await RedisDataSource.delete("key");
    const deletedBufferValue = await RedisDataSource.get<Buffer>("key");
    expect(deletedBufferValue).toBe(null);
  });

  test("redis static number operations", async () => {
    RedisDataSource.set("key", 1, 1000);
    const numberValue = await RedisDataSource.get<number>("key");
    expect(numberValue).toBe(1);

    await RedisDataSource.delete("key");
    const deletedNumberValue = await RedisDataSource.get<number>("key");
    expect(deletedNumberValue).toBe(null);
  });

  test("redis static boolean operations", async () => {
    RedisDataSource.set("key", true, 1000);
    const booleanValue = await RedisDataSource.get<boolean>("key");
    expect(booleanValue).toBe(true);

    await RedisDataSource.delete("key");
    const deletedBooleanValue = await RedisDataSource.get<boolean>("key");
    expect(deletedBooleanValue).toBe(null);
  });

  test("redis static array operations", async () => {
    RedisDataSource.set("key", [1, 2, 3], 1000);
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
});
