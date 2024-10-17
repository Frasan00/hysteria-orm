import { Redis_data_source } from "../../src/no_sql/redis/redis_data_source";

let redisInstance: Redis_data_source;
describe("RedisDataSource", () => {
  beforeAll(async () => {
    await Redis_data_source.connect({
      host: "localhost",
      port: 6379,
      username: "default",
      password: "root",
    });

    redisInstance = await Redis_data_source.getConnection({
      host: "localhost",
      port: 6379,
      username: "default",
      password: "password",
    });
  });

  afterAll(async () => {
    await redisInstance.disconnect();
    await Redis_data_source.disconnect();
  });

  // Test singleton static class
  test("redis static isConnected check", async () => {
    expect(Redis_data_source.isConnected).toBe(true);
  });

  test("redis static string operations", async () => {
    Redis_data_source.set("key", "value", 1000);
    const value = await Redis_data_source.get<string | null>("key");
    expect(value).toBe("value");

    await Redis_data_source.delete("key");
    const deletedValue = await Redis_data_source.get<string>("key");
    expect(deletedValue).toBe(null);
  });

  test("redis static object operations", async () => {
    Redis_data_source.set("key", { key: "value" }, 1000);
    const objectValue = await Redis_data_source.get<{ key: string }>("key");
    expect(objectValue).toEqual({ key: "value" });

    await Redis_data_source.delete("key");
    const deletedObjectValue = await Redis_data_source.get<{ key: string }>(
      "key",
    );
    expect(deletedObjectValue).toBe(null);
  });

  test("redis static buffer operations", async () => {
    Redis_data_source.set("key", Buffer.from("value"), 10000);
    const bufferValue = await Redis_data_source.getBuffer("key");
    expect(bufferValue).toEqual(Buffer.from("value"));

    await Redis_data_source.delete("key");
    const deletedBufferValue = await Redis_data_source.get<Buffer>("key");
    expect(deletedBufferValue).toBe(null);
  });

  test("redis static number operations", async () => {
    Redis_data_source.set("key", 1, 1000);
    const numberValue = await Redis_data_source.get<number>("key");
    expect(numberValue).toBe(1);

    await Redis_data_source.delete("key");
    const deletedNumberValue = await Redis_data_source.get<number>("key");
    expect(deletedNumberValue).toBe(null);
  });

  test("redis static boolean operations", async () => {
    Redis_data_source.set("key", true, 1000);
    const booleanValue = await Redis_data_source.get<boolean>("key");
    expect(booleanValue).toBe(true);

    await Redis_data_source.delete("key");
    const deletedBooleanValue = await Redis_data_source.get<boolean>("key");
    expect(deletedBooleanValue).toBe(null);
  });

  test("redis static array operations", async () => {
    Redis_data_source.set("key", [1, 2, 3], 1000);
    const arrayValue = await Redis_data_source.get<number[]>("key");
    expect(arrayValue).toEqual([1, 2, 3]);

    await Redis_data_source.delete("key");
    const deletedArrayValue = await Redis_data_source.get<number[]>("key");
    expect(deletedArrayValue).toBe(null);
  });

  // Test instance class
  test("redis instance isConnected check", async () => {
    expect(redisInstance.isConnected).toBe(true);
  });

  test("redis instance string operations", async () => {
    redisInstance.set("key", "value", 1000);
    const value = await redisInstance.get<string>("key");
    expect(value).toBe("value");

    await redisInstance.delete("key");
    const deletedValue = await redisInstance.get<string>("key");
    expect(deletedValue).toBe(null);
  });

  test("redis instance object operations", async () => {
    redisInstance.set("key", { key: "value" }, 1000);
    const objectValue = await redisInstance.get<{ key: string }>("key");
    expect(objectValue).toEqual({ key: "value" });

    await redisInstance.delete("key");
    const deletedObjectValue = await redisInstance.get<{ key: string }>("key");
    expect(deletedObjectValue).toBe(null);
  });

  test("redis instance buffer operations", async () => {
    redisInstance.set("key", Buffer.from("value"), 1000);
    const bufferValue = await Redis_data_source.getBuffer("key");
    expect(bufferValue).toEqual(Buffer.from("value"));

    await redisInstance.delete("key");
    const deletedBufferValue = await redisInstance.get<Buffer>("key");
    expect(deletedBufferValue).toBe(null);
  });

  test("redis instance number operations", async () => {
    redisInstance.set("key", 1, 1000);
    const numberValue = await redisInstance.get<number>("key");
    expect(numberValue).toBe(1);

    await redisInstance.delete("key");
    const deletedNumberValue = await redisInstance.get<number>("key");
    expect(deletedNumberValue).toBe(null);
  });

  test("redis instance boolean operations", async () => {
    redisInstance.set("key", true, 1000);
    const booleanValue = await redisInstance.get<boolean>("key");
    expect(booleanValue).toBe(true);

    await redisInstance.delete("key");
    const deletedBooleanValue = await redisInstance.get<boolean>("key");
    expect(deletedBooleanValue).toBe(null);
  });

  test("redis instance array operations", async () => {
    redisInstance.set("key", [1, 2, 3], 1000);
    const arrayValue = await redisInstance.get<number[]>("key");
    expect(arrayValue).toEqual([1, 2, 3]);

    await redisInstance.delete("key");
    const deletedArrayValue = await redisInstance.get<number[]>("key");
    expect(deletedArrayValue).toBe(null);
  });
});
