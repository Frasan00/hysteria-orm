import {
  createMixin,
  timestampMixin,
  type MixinColumns,
} from "../../../src/sql/models/mixins";
import { Model } from "../../../src/sql/models/model";

describe("createMixin factory", () => {
  describe("basic functionality", () => {
    test("createMixin returns a function", () => {
      interface TestFields {
        testField: string;
      }

      const testMixin = createMixin<TestFields>({
        testField: {},
      });

      expect(typeof testMixin).toBe("function");
    });

    test("mixin result extends Model", () => {
      interface StatusFields {
        status: string;
      }

      const statusMixin = createMixin<StatusFields>({
        status: {},
      });

      class TestModel extends statusMixin() {
        static table = "test_models";
      }

      expect(TestModel.prototype).toBeInstanceOf(Model);
    });

    test("mixin result has Model static methods", () => {
      interface TagFields {
        tag: string;
      }

      const tagMixin = createMixin<TagFields>({
        tag: {},
      });

      class TestModel extends tagMixin() {
        static table = "test_models";
      }

      expect(typeof TestModel.query).toBe("function");
      expect(typeof TestModel.find).toBe("function");
      expect(typeof TestModel.first).toBe("function");
      expect(typeof TestModel.insert).toBe("function");
    });

    test("mixin can be instantiated via class extension", () => {
      interface NameFields {
        displayName: string;
      }

      const nameMixin = createMixin<NameFields>({
        displayName: {},
      });

      class TestModel extends nameMixin() {
        static table = "test_models";
      }

      const instance = new TestModel();
      expect(instance).toBeInstanceOf(Model);
    });
  });

  describe("column options", () => {
    test("datetime column type", () => {
      interface DateFields {
        publishedAt: Date;
      }

      const dateMixin = createMixin<DateFields>({
        publishedAt: { type: "datetime", nullable: true },
      });

      class TestModel extends dateMixin() {
        static table = "test_models";
      }

      expect(TestModel.prototype).toBeInstanceOf(Model);
    });

    test("boolean column type", () => {
      interface BoolFields {
        isActive: boolean;
      }

      const boolMixin = createMixin<BoolFields>({
        isActive: { type: "boolean" },
      });

      class TestModel extends boolMixin() {
        static table = "test_models";
      }

      expect(TestModel.prototype).toBeInstanceOf(Model);
    });

    test("json column type", () => {
      interface JsonFields {
        metadata: Record<string, unknown>;
      }

      const jsonMixin = createMixin<JsonFields>({
        metadata: { type: "json", nullable: true },
      });

      class TestModel extends jsonMixin() {
        static table = "test_models";
      }

      expect(TestModel.prototype).toBeInstanceOf(Model);
    });

    test("integer column type with default", () => {
      interface IntFields {
        count: number;
      }

      const intMixin = createMixin<IntFields>({
        count: { type: "integer", default: 0 },
      });

      class TestModel extends intMixin() {
        static table = "test_models";
      }

      expect(TestModel.prototype).toBeInstanceOf(Model);
    });

    test("nullable column", () => {
      interface NullableFields {
        description: string | null;
      }

      const nullableMixin = createMixin<NullableFields>({
        description: { nullable: true },
      });

      class TestModel extends nullableMixin() {
        static table = "test_models";
      }

      expect(TestModel.prototype).toBeInstanceOf(Model);
    });
  });

  describe("composability", () => {
    test("custom mixin can compose with timestampMixin", () => {
      interface AuditFields {
        createdBy: string | null;
        updatedBy: string | null;
      }

      const auditMixin = createMixin<AuditFields>({
        createdBy: { nullable: true },
        updatedBy: { nullable: true },
      });

      class TestModel extends auditMixin(timestampMixin()) {
        static table = "test_models";
      }

      expect(TestModel.prototype).toBeInstanceOf(Model);
      expect(typeof TestModel.query).toBe("function");

      const instance = new TestModel();
      expect(instance).toBeInstanceOf(Model);
    });

    test("custom mixin preserves softDeleteColumn", () => {
      interface SimpleFields {
        note: string;
      }

      const simpleMixin = createMixin<SimpleFields>({
        note: {},
      });

      class TestModel extends simpleMixin(timestampMixin()) {
        static table = "test_models";
      }

      expect(TestModel.softDeleteColumn).toBe("deletedAt");
    });
  });

  describe("type exports", () => {
    test("MixinColumns type is usable", () => {
      interface CustomFields {
        customField: string;
      }

      const columns: MixinColumns<CustomFields> = {
        customField: {},
      };

      expect(columns.customField).toBeDefined();
    });
  });

  describe("multiple columns", () => {
    test("mixin with multiple columns", () => {
      interface MultiFields {
        firstName: string;
        lastName: string;
        age: number;
        isVerified: boolean;
      }

      const multiMixin = createMixin<MultiFields>({
        firstName: {},
        lastName: {},
        age: { type: "integer" },
        isVerified: { type: "boolean" },
      });

      class TestModel extends multiMixin() {
        static table = "test_models";
      }

      expect(TestModel.prototype).toBeInstanceOf(Model);
      expect(typeof TestModel.query).toBe("function");

      const instance = new TestModel();
      expect(instance).toBeInstanceOf(Model);
    });
  });
});
