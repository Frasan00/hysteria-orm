import {
  timestampMixin,
  uuidMixin,
  type UuidFields,
} from "../../../src/sql/models/mixins";
import { Model } from "../../../src/sql/models/model";

describe("uuidMixin", () => {
  test("UuidFields interface has string id", () => {
    const fields: UuidFields = { id: "550e8400-e29b-41d4-a716-446655440000" };
    expect(typeof fields.id).toBe("string");
  });

  test("uuidMixin returns constructor with Model methods and can be composed", () => {
    class TestModel extends timestampMixin(uuidMixin()) {
      static table = "test_composed";
    }

    expect(TestModel.prototype).toBeInstanceOf(Model);
    expect(typeof TestModel.query).toBe("function");
    expect(typeof TestModel.find).toBe("function");

    const instance = new TestModel();
    expect(instance).toBeInstanceOf(Model);
  });
});
