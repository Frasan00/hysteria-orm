import { MongoDataSource } from "../../src/no_sql/mongo/mongo_data_source";
import {
  defineCollection,
  prop,
} from "../../src/no_sql/mongo/mongo_models/define_collection";

const TestModel = defineCollection("test_models", {
  properties: {
    name: prop.string(),
    email: prop.string(),
  },
});

describe("TestModel", () => {
  let mongoDataSource: MongoDataSource;

  beforeAll(async () => {
    mongoDataSource = new MongoDataSource({
      url: "mongodb://root:root@localhost:27017/?replicaSet=rs0",
    });
    await mongoDataSource.connect();
  });

  beforeEach(async () => {
    await mongoDataSource.from(TestModel).query().delete();
  });

  afterAll(async () => {
    await mongoDataSource.from(TestModel).query().delete();
    await mongoDataSource.disconnect();
  });

  describe("Session Tests", () => {
    it("should start and commitTransaction a session", async () => {
      const session = mongoDataSource.startSession();
      try {
        await mongoDataSource
          .from(TestModel, { session })
          .insert({ name: "Test Name", email: "test@example.com" });
        await session.commitTransaction();

        const count = await mongoDataSource.from(TestModel).query().count();
        expect(count).toBe(1);
      } catch (error) {
        await session.abortTransaction();
        throw error;
      }
    });

    it("should abortTransaction a session", async () => {
      const session = mongoDataSource.startSession();
      try {
        await mongoDataSource
          .from(TestModel, { session })
          .insert({ name: "Test Name", email: "test@example.com" });
        throw new Error("Intentional Error");
        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        const count = await mongoDataSource.from(TestModel).query().count();
        expect(count).toBe(0);
      }
    });
  });

  // Some session based tests
  test("should insert a record", async () => {
    const session = mongoDataSource.startSession();
    try {
      const modelData = { name: "Test Name", email: "test" };
      const insertedModel = await mongoDataSource
        .from(TestModel, { session })
        .insert(modelData);
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
      const insertedModels = await mongoDataSource
        .from(TestModel, { session })
        .insertMany(modelData);
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
      await mongoDataSource.from(TestModel, { session }).insert(modelData);
      throw new Error("Intentional Error");
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      const count = await mongoDataSource.from(TestModel).query().count();
      expect(count).toBe(0);
    }
  });
});
