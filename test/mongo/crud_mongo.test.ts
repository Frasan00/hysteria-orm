import { MongoDataSource } from "../../src/no_sql/mongo/mongo_data_source";
import { DateTime } from "luxon";
import { TestModel } from "./mongo_collections/test_collection";

describe("TestModel", () => {
  let mongoDataSource: MongoDataSource;

  beforeAll(async () => {
    mongoDataSource = await MongoDataSource.connect(
      "mongodb://root:root@localhost:27017",
    );
  });

  beforeEach(async () => {
    await TestModel.query().delete();
  });

  afterAll(async () => {
    await TestModel.query().delete();
    await mongoDataSource.disconnect();
  });

  describe("model methods", () => {
    test("should insert a record", async () => {
      const modelData = { name: "Test Name", email: "test@example.com" };
      const insertedModel = await TestModel.insert(modelData);
      expect(insertedModel.name).toBe("Test Name");
      expect(insertedModel.email).toBe("test@example.com");
    });

    test("should insert multiple records", async () => {
      const modelData = [
        { name: "Test Name 1", email: "test1@example.com" },
        { name: "Test Name 2", email: "test2@example.com" },
      ];
      const insertedModels = await TestModel.insertMany(modelData);
      expect(insertedModels.length).toBe(2);
      expect(insertedModels[0].name).toBe("Test Name 1");
      expect(insertedModels[0].email).toBe("test1@example.com");
      expect(insertedModels[1].name).toBe("Test Name 2");
      expect(insertedModels[1].email).toBe("test2@example.com");
    });

    test("should find records", async () => {
      await TestModel.insertMany([
        { name: "Test Name 1", email: "test1@example.com" },
        { name: "Test Name 2", email: "test2@example.com" },
      ]);

      const foundModels = await TestModel.find();
      expect(foundModels.length).toBe(2);
    });

    test("should find one record", async () => {
      const insertedModel = await TestModel.insert({
        name: "Test Name",
        email: "test@example.com",
      });
      const foundModel = await TestModel.findOne({
        where: { id: insertedModel.id },
      });
      expect(foundModel?.name).toBe("Test Name");
      expect(foundModel?.email).toBe("test@example.com");
    });

    test("should find one record or fail", async () => {
      const insertedModel = await TestModel.insert({
        name: "Test Name",
        email: "test@example.com",
      });

      const foundModel = await TestModel.findOneOrFail({
        where: { id: insertedModel.id },
      });

      expect(foundModel.name).toBe("Test Name");
      expect(foundModel.email).toBe("test@example.com");
    });

    test("should update a record", async () => {
      const insertedModel = await TestModel.insert({
        name: "Test Name",
        email: "test@example.com",
      });
      insertedModel.name = "Updated Name";
      insertedModel.email = "updated@example.com";
      const updatedModel = await TestModel.updateRecord(insertedModel);
      expect(updatedModel.name).toBe("Updated Name");
      expect(updatedModel.email).toBe("updated@example.com");
    });

    test("should delete a record", async () => {
      const insertedModel = await TestModel.insert({
        name: "Test Name",
        email: "test@example.com",
      });

      await TestModel.deleteRecord(insertedModel);
      const foundModel = await TestModel.findOne({
        where: { id: insertedModel.id },
      });
      expect(foundModel).toBeNull();
    });

    test("should query records using orWhere", async () => {
      await TestModel.insertMany([
        { name: "Test Name 1", email: "test1@example.com" },
        { name: "Test Name 2", email: "test2@example.com" },
        { name: "Test Name 3", email: "test3@example.com" },
      ]);

      const foundModels = await TestModel.query()
        .orWhere("name", "Test Name 1")
        .orWhere("name", "Test Name 2")
        .many();

      expect(foundModels.length).toBe(2);
      expect(foundModels.some((model) => model.name === "Test Name 1")).toBe(
        true,
      );
      expect(
        foundModels.some((model) => model.email === "test2@example.com"),
      ).toBe(true);
    });

    test("should sort records", async () => {
      await TestModel.insertMany([
        { name: "Test Name 1", email: "test1@example.com" },
        { name: "Test Name 2", email: "test2@example.com" },
        { name: "Test Name 3", email: "test3@example.com" },
      ]);

      const foundModels = await TestModel.query().sort({ name: -1 }).many();

      expect(foundModels.length).toBe(3);
      expect(foundModels[0].name).toBe("Test Name 3");
      expect(foundModels[1].name).toBe("Test Name 2");
      expect(foundModels[2].name).toBe("Test Name 1");
    });

    test("should limit records", async () => {
      await TestModel.insertMany([
        { name: "Test Name 1", email: "test1@example.com" },
        { name: "Test Name 2", email: "test2@example.com" },
        { name: "Test Name 3", email: "test3@example.com" },
      ]);

      const foundModels = await TestModel.query().limit(2).many();

      expect(foundModels.length).toBe(2);
    });

    test("should find records using whereIn", async () => {
      await TestModel.insertMany([
        { name: "Test Name 1", email: "test" },
        { name: "Test Name 2", email: "test" },
        { name: "Test Name 3", email: "test" },
      ]);

      const foundModels = await TestModel.query()
        .whereIn("name", ["Test Name 1", "Test Name 2"])
        .many();

      expect(foundModels.length).toBe(2);
    });

    test("should find records using whereNull", async () => {
      const users = await TestModel.insertMany([
        { name: "Test Name 1", email: "test" },
        { name: "Test Name 2" },
        { name: "Test Name 3" },
      ]);

      const foundModels = await TestModel.query().whereNull("email").many();
      expect(foundModels.length).toBe(2);
    });

    test("should find records using raw query", async () => {
      await TestModel.insertMany([
        { name: "Test Name 1", email: "test" },
        { name: "Test Name 2" },
        { name: "Test Name 3" },
      ]);

      const foundModels = await TestModel.query()
        .rawWhere({
          email: { $exists: false },
        })
        .many();

      const foundModels2 = await TestModel.query()
        .andRawWhere({
          email: { $exists: false },
        })
        .many();

      const foundModels3 = await TestModel.query()
        .orRawWhere({
          email: { $exists: false },
        })
        .many();

      expect(foundModels.length).toBe(2);
      expect(foundModels2.length).toBe(2);
      expect(foundModels3.length).toBe(2);
    });

    test("should find records using whereBetween", async () => {
      await TestModel.insertMany([
        { name: "Test Name 1", email: "test" },
        { name: "Test Name 2" },
        { name: "Test Name 3" },
      ]);

      const foundModels = await TestModel.query()
        .whereBetween("name", ["Test Name 1", "Test Name 2"])
        .many();

      expect(foundModels.length).toBe(2);
    });

    test("should find records using whereNotIn", async () => {
      await TestModel.insertMany([
        { name: "Test Name 1", email: "test" },
        { name: "Test Name 2" },
        { name: "Test Name 3" },
      ]);

      const foundModels = await TestModel.query()
        .whereNotIn("name", ["Test Name 1", "Test Name 2"])
        .many();

      expect(foundModels.length).toBe(1);
    });

    test("should find records using whereNot", async () => {
      await TestModel.insertMany([
        { name: "Test Name 1", email: "test" },
        { name: "Test Name 2" },
        { name: "Test Name 3" },
      ]);

      const foundModels = await TestModel.query()
        .where("email", "$ne", "test")
        .many();

      expect(foundModels.length).toBe(2);
    });

    test("should find records using where and andWhere", async () => {
      await TestModel.insertMany([
        { name: "Test Name 1", email: "test" },
        { name: "Test Name 2", email: "test" },
        { name: "Test Name 3" },
      ]);

      const foundModels = await TestModel.query()
        .where("email", "test")
        .andWhere("name", "Test Name 1")
        .many();

      expect(foundModels.length).toBe(1);
    });

    test("should find records using where and andWhere", async () => {
      const inserted = await TestModel.insertMany([
        { name: "Test Name 1", email: "test" },
      ]);

      const foundModels = await TestModel.query()
        .where("id", inserted[0].id)
        .many();

      expect(foundModels.length).toBe(1);
    });

    test("should insert a record with nested object", async () => {
      const modelData = {
        name: "Test Name",
        email: "test",
        userProfile: {
          birthData: DateTime.now(),
          age: 20,
          preferredName: "test",
        },
      };

      const insertedModel = await TestModel.insert(modelData);
      expect(insertedModel.name).toBe("Test Name");
      expect(insertedModel.email).toBe("test");
      expect(insertedModel.userProfile.age).toBe(20);

      const sorted = await TestModel.query()
        .sort({ "userProfile.age": -1 })
        .many();
      expect(sorted[0].userProfile.age).toBe(20);

      const filtered = await TestModel.query()
        .where("userProfile.age", 20)
        .many();
      expect(filtered.length).toBe(1);
    });

    test("should find records using whereExists and whereNotExists", async () => {
      await TestModel.insertMany([
        { name: "Test Name 1", email: "test" },
        { name: "Test Name 2" },
        { name: "Test Name 3" },
      ]);

      const foundModels = await TestModel.query().whereExists("email").many();

      const foundModels2 = await TestModel.query()
        .whereNotExists("email")
        .many();

      expect(foundModels.length).toBe(1);
      expect(foundModels2.length).toBe(2);
    });

    test("should find records using whereLike and whereNotLike", async () => {
      await TestModel.insertMany([
        { name: "Test Name 1", email: "test" },
        { name: "Test Name 2", email: "test" },
        { name: "Test Name 3" },
      ]);

      const foundModels = await TestModel.query()
        .whereLike("email", "test")
        .many();

      const foundModels2 = await TestModel.query()
        .whereNotLike("email", "test")
        .many();

      const foundModels3 = await TestModel.query()
        .andWhereLike("email", "test")
        .many();

      const foundModels4 = await TestModel.query()
        .andWhereNotLike("email", "test")
        .many();

      const foundModels5 = await TestModel.query()
        .orWhereLike("email", "test")
        .many();

      const foundModels6 = await TestModel.query()
        .orWhereNotLike("email", "test")
        .many();

      expect(foundModels.length).toBe(2);
      expect(foundModels2.length).toBe(1);
      expect(foundModels3.length).toBe(2);
      expect(foundModels4.length).toBe(1);
      expect(foundModels5.length).toBe(2);
      expect(foundModels6.length).toBe(1);
    });
  });

  describe("query builder", () => {
    test("should insert and return the inserted document", async () => {
      const insertedModel = await MongoDataSource.query("test").insert(
        {
          name: "Test Name",
          email: "test",
        },
        {
          returning: true,
        },
      );

      expect(insertedModel.id).toBeDefined();
      expect(insertedModel.name).toBe("Test Name");
      expect(insertedModel.email).toBe("test");
    });

    test("should insert and return only the id of the inserted document", async () => {
      const insertedModel = await MongoDataSource.query("test").insert({
        name: "Test Name",
        email: "test",
      });

      expect(insertedModel.id).toBeDefined();
    });

    test("should insert multiple records and return the inserted documents", async () => {
      const insertedModels = await MongoDataSource.query("test").insertMany(
        [
          { name: "Test Name 1", email: "test" },
          { name: "Test Name 2", email: "test" },
        ],
        {
          returning: true,
        },
      );

      expect(insertedModels.length).toBe(2);
      expect(insertedModels[0].id).toBeDefined();
      expect(insertedModels[1].id).toBeDefined();
    });

    test("should insert multiple records and return the inserted documents", async () => {
      const insertedModels = await MongoDataSource.query("test").insertMany([
        { name: "Test Name 1", email: "test" },
        { name: "Test Name 2", email: "test" },
      ]);

      expect(insertedModels.length).toBe(2);
      expect(insertedModels[0].id).toBeDefined();
      expect(insertedModels[1].id).toBeDefined();
    });
  });
});
