import {
  timestampMixin,
  type BigIntFields,
  type IncrementFields,
  type TimestampFields,
  type UlidFields,
  type UuidFields,
} from "../../../src/sql/models/mixins";
import { Model } from "../../../src/sql/models/model";

describe("Mixin Type Structure", () => {
  describe("timestampMixin", () => {
    test("should return a constructor that extends Model", () => {
      const MixinResult = timestampMixin();

      expect(MixinResult.prototype).toBeInstanceOf(Model);
      expect(typeof MixinResult.query).toBe("function");
      expect(typeof MixinResult.find).toBe("function");
      expect(typeof MixinResult.first).toBe("function");
      expect(typeof MixinResult.insert).toBe("function");
    });

    test("should preserve Model static properties", () => {
      const MixinResult = timestampMixin();

      expect(MixinResult.softDeleteColumn).toBe("deletedAt");
      expect(typeof MixinResult.table).toBe("string");
    });

    test("timestampMixin with Model parameter", () => {
      const MixinResult = timestampMixin(Model);

      expect(MixinResult.prototype).toBeInstanceOf(Model);
      expect(typeof MixinResult.query).toBe("function");
    });
  });
});

describe("Mixin Type Exports", () => {
  test("TimestampFields interface has correct properties", () => {
    const fields: TimestampFields = {
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    expect(fields.createdAt).toBeInstanceOf(Date);
    expect(fields.updatedAt).toBeInstanceOf(Date);
    expect(fields.deletedAt).toBeNull();
  });

  test("TimestampFields allows Date for deletedAt", () => {
    const fields: TimestampFields = {
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: new Date(),
    };

    expect(fields.deletedAt).toBeInstanceOf(Date);
  });

  test("IncrementFields interface has id property", () => {
    const fields: IncrementFields = { id: 1 };
    expect(typeof fields.id).toBe("number");
  });

  test("BigIntFields interface has id property", () => {
    const fields: BigIntFields = { id: 123456789 };
    expect(typeof fields.id).toBe("number");
  });

  test("UuidFields interface has string id", () => {
    const fields: UuidFields = { id: "550e8400-e29b-41d4-a716-446655440000" };
    expect(typeof fields.id).toBe("string");
  });

  test("UlidFields interface has string id", () => {
    const fields: UlidFields = { id: "01ARZ3NDEKTSV4RRFFQ69G5FAV" };
    expect(typeof fields.id).toBe("string");
  });
});

describe("Mixin TypeScript Types", () => {
  test("timestampMixin return type includes Model methods", () => {
    const MixinClass = timestampMixin();

    type MixinType = typeof MixinClass;
    type HasQuery = MixinType extends { query: (...args: any[]) => any }
      ? true
      : false;
    type HasFind = MixinType extends { find: (...args: any[]) => any }
      ? true
      : false;
    type HasFirst = MixinType extends { first: (...args: any[]) => any }
      ? true
      : false;

    const hasQuery: HasQuery = true;
    const hasFind: HasFind = true;
    const hasFirst: HasFirst = true;

    expect(hasQuery).toBe(true);
    expect(hasFind).toBe(true);
    expect(hasFirst).toBe(true);
  });

  test("timestampMixin can be extended and instantiated", () => {
    class TestModel extends timestampMixin() {}
    const instance = new TestModel();

    expect(instance).toBeInstanceOf(Model);
  });

  test("composed mixin preserves softDeleteColumn", () => {
    const MixinClass = timestampMixin();

    expect(MixinClass.softDeleteColumn).toBe("deletedAt");
  });

  test("mixin class can have custom table name", () => {
    class CustomModel extends timestampMixin() {
      static table = "custom_table_name";
    }

    expect(CustomModel.table).toBe("custom_table_name");
  });

  test("mixin instance is Model instance", () => {
    class CustomModel extends timestampMixin() {}
    const instance = new CustomModel();

    expect(instance).toBeInstanceOf(Model);
  });
});
