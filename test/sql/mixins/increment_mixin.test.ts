import {
  incrementMixin,
  timestampMixin,
  type IncrementFields,
} from "../../../src/sql/models/mixins";
import { Model } from "../../../src/sql/models/model";

describe("incrementMixin", () => {
  test("IncrementFields interface has id property", () => {
    const fields: IncrementFields = { id: 1 };
    expect(typeof fields.id).toBe("number");
  });

  test("incrementMixin returns constructor with Model methods and can be composed", () => {
    class TestModel extends timestampMixin(incrementMixin()) {
      static table = "test_composed";
    }

    expect(TestModel.prototype).toBeInstanceOf(Model);
    expect(typeof TestModel.query).toBe("function");
    expect(typeof TestModel.find).toBe("function");

    const instance = new TestModel();
    expect(instance).toBeInstanceOf(Model);
  });
});
