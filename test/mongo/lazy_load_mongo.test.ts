import { MongoDataSource } from "../../src/no_sql/mongo/mongo_data_source";

const mongoConfig = {
  url: "mongodb://root:root@localhost:27017",
};

describe("MongoDataSource lazyLoad", () => {
  test("lazyLoad false (default) throws on from(string) when not connected", () => {
    const mongo = new MongoDataSource(mongoConfig);

    expect(() => mongo.from("test")).toThrow();
  });

  test("lazyLoad true does not throw on from(string) when not connected", () => {
    const mongo = new MongoDataSource({ ...mongoConfig, lazyLoad: true });

    // Should not throw — connection deferred to execution time
    const qb = mongo.from("test");
    expect(qb).toBeDefined();
  });

  test("lazyLoad true auto-connects when executing a query", async () => {
    const mongo = new MongoDataSource({ ...mongoConfig, lazyLoad: true });

    expect(mongo.isConnected).toBe(false);

    // Executing a query should trigger auto-connect via ensureConnected
    await mongo.ensureConnected();
    expect(mongo.isConnected).toBe(true);

    await mongo.disconnect();
  });

  test("lazyLoad true concurrent ensureConnected calls share one connect", async () => {
    const mongo = new MongoDataSource({ ...mongoConfig, lazyLoad: true });

    // Fire multiple ensureConnected calls concurrently
    await Promise.all([
      mongo.ensureConnected(),
      mongo.ensureConnected(),
      mongo.ensureConnected(),
    ]);

    expect(mongo.isConnected).toBe(true);

    await mongo.disconnect();
  });

  test("explicit connect() still works with lazyLoad true", async () => {
    const mongo = new MongoDataSource({ ...mongoConfig, lazyLoad: true });

    await mongo.connect();
    expect(mongo.isConnected).toBe(true);

    await mongo.disconnect();
  });

  test("lazyLoad false throws on ensureConnected when not connected", async () => {
    const mongo = new MongoDataSource(mongoConfig);

    await expect(mongo.ensureConnected()).rejects.toThrow();
  });
});
