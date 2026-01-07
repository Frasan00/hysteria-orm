import {
  timestampMixin,
  ulidMixin,
  type UlidFields,
} from "../../../src/sql/models/mixins";
import { Model } from "../../../src/sql/models/model";

describe("ulidMixin", () => {
  test("UlidFields interface has string id", () => {
    const fields: UlidFields = { id: "01ARZ3NDEKTSV4RRFFQ69G5FAV" };
    expect(typeof fields.id).toBe("string");
  });

  test("ulidMixin returns constructor with Model methods and can be composed", () => {
    class TestModel extends timestampMixin(ulidMixin()) {
      static table = "test_composed";
    }

    expect(TestModel.prototype).toBeInstanceOf(Model);
    expect(typeof TestModel.query).toBe("function");
    expect(typeof TestModel.find).toBe("function");

    const instance = new TestModel();
    expect(instance).toBeInstanceOf(Model);
  });
});
