import {
  bigIntMixin,
  timestampMixin,
  type BigIntFields,
} from "../../../src/sql/models/mixins";
import { Model } from "../../../src/sql/models/model";

describe("bigIntMixin", () => {
  test("BigIntFields interface has id property", () => {
    const fields: BigIntFields = { id: 123456789 };
    expect(typeof fields.id).toBe("number");
  });

  test("bigIntMixin returns constructor with Model methods and can be composed", () => {
    class TestModel extends timestampMixin(bigIntMixin()) {
      static table = "test_composed";
    }

    expect(TestModel.prototype).toBeInstanceOf(Model);
    expect(typeof TestModel.query).toBe("function");
    expect(typeof TestModel.find).toBe("function");

    const instance = new TestModel();
    expect(instance).toBeInstanceOf(Model);
  });
});
