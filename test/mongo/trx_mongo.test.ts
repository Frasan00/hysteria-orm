import { property } from "../../src/no_sql/mongo/mongo_models/mongo_collection_decorators";
import { MongoDataSource } from "../../src/no_sql/mongo/mongo_data_source";
import { Collection } from "../../src/no_sql/mongo/mongo_models/mongo_collection";

class TestModel extends Collection {
  @property()
  declare name: string;

  @property()
  declare email: string;
}

describe("TestModel", () => {
  let mongoDataSource: MongoDataSource;

  beforeAll(async () => {
    mongoDataSource = await MongoDataSource.connect(
      "mongodb://root:root@localhost:27017/?replicaSet=rs0",
      {},
    );
  });

  beforeEach(async () => {
    await TestModel.query().delete();
  });

  afterAll(async () => {
    await TestModel.query().delete();
    await mongoDataSource.disconnect();
  });

  describe("Session Tests", () => {
    it("should start and commitTransaction a session", async () => {
      const session = mongoDataSource.startSession();
      try {
        await TestModel.insert(
          { name: "Test Name", email: "test@example.com" },
          { session },
        );
        await session.commitTransaction();

        const count = await TestModel.query().count();
        expect(count).toBe(1);
      } catch (error) {
        await session.abortTransaction();
        throw error;
      }
    });

    it("should abortTransaction a session", async () => {
      const session = mongoDataSource.startSession();
      try {
        await TestModel.insert(
          { name: "Test Name", email: "test@example.com" },
          { session },
        );
        throw new Error("Intentional Error");
        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        const count = await TestModel.query().count();
        expect(count).toBe(0);
      }
    });
  });

  // Some session based tests
  test("should insert a record", async () => {
    const session = mongoDataSource.startSession();
    try {
      const modelData = { name: "Test Name", email: "test" };
      const insertedModel = await TestModel.insert(modelData, { session });
      await session.commitTransaction();
      expect(insertedModel.name).toBe("Test Name");
      expect(insertedModel.email).toBe("test");
    } catch (error) {
      await session.abortTransaction();
      throw error;
    }
  });

  test("should insert multiple records", async () => {
    const session = mongoDataSource.startSession();
    try {
      const modelData = [
        { name: "Test Name 1", email: "asdasd" },
        { name: "Test Name 2", email: "asdasd" },
      ];
      const insertedModels = await TestModel.insertMany(modelData, { session });
      await session.commitTransaction();
      expect(insertedModels.length).toBe(2);
      expect(insertedModels[0].name).toBe("Test Name 1");
      expect(insertedModels[0].email).toBe("asdasd");
      expect(insertedModels[1].name).toBe("Test Name 2");
      expect(insertedModels[1].email).toBe("asdasd");
    } catch (error) {
      await session.abortTransaction();
      throw error;
    }
  });

  test("should abortTransaction a session", async () => {
    const session = mongoDataSource.startSession();
    try {
      const modelData = { name: "Test Name", email: "test" };
      await TestModel.insert(modelData, { session });
      throw new Error("Intentional Error");
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      const count = await TestModel.query().count();
      expect(count).toBe(0);
    }
  });
});
