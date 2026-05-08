import { defineModel, col } from "../../../src/sql/models/define_model";
import { ValidationError } from "../../../src/errors/hysteria_error";
import {
  required,
  email,
  min,
} from "../../../src/sql/models/validators/builtin_validators";

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string({ validate: required }),
    email: col.string({ validate: [required, email] }),
    age: col.integer({ validate: min(0) }),
  },
});

async function expectValidationError(
  promise: Promise<any>,
  expectedErrors: Record<string, string[]>,
): Promise<void> {
  try {
    await promise;
    throw new Error("Expected ValidationError to be thrown");
  } catch (e: any) {
    expect(e).toBeInstanceOf(ValidationError);
    expect(e.errors).toEqual(expectedErrors);
  }
}

describe("Model.validate() with defineModel", () => {
  describe("valid data", () => {
    test("returns { valid: true } when all validators pass", async () => {
      const result = await User.validate({
        name: "John Doe",
        email: "john@example.com",
        age: 25,
      });
      expect(result).toEqual({ valid: true });
    });

    test("accepts age of 0 (boundary of min(0))", async () => {
      const result = await User.validate({
        name: "John",
        email: "john@example.com",
        age: 0,
      });
      expect(result).toEqual({ valid: true });
    });
  });

  describe("single validator (col.string with required)", () => {
    test("rejects undefined name", async () => {
      await expectValidationError(
        User.validate({ email: "john@example.com", age: 25 }),
        { name: ["Value is required"] },
      );
    });

    test("rejects empty string name", async () => {
      await expectValidationError(
        User.validate({ name: "", email: "john@example.com", age: 25 }),
        { name: ["Value is required"] },
      );
    });

    test("rejects null name", async () => {
      await expectValidationError(
        User.validate({
          name: null as any,
          email: "john@example.com",
          age: 25,
        }),
        { name: ["Value is required"] },
      );
    });

    test("accepts valid name string", async () => {
      const result = await User.validate({
        name: "Alice",
        email: "alice@test.com",
        age: 30,
      });
      expect(result).toEqual({ valid: true });
    });
  });

  describe("validator array (col.string with [required, email])", () => {
    test("rejects missing email (required fires)", async () => {
      await expectValidationError(User.validate({ name: "John", age: 25 }), {
        email: ["Value is required"],
      });
    });

    test("rejects invalid email format (email validator fires)", async () => {
      await expectValidationError(
        User.validate({ name: "John", email: "not-an-email", age: 25 }),
        { email: ["Invalid email"] },
      );
    });

    test("rejects empty email (both validators fire)", async () => {
      await expectValidationError(
        User.validate({ name: "John", email: "", age: 25 }),
        { email: ["Value is required", "Invalid email"] },
      );
    });

    test("accepts valid email", async () => {
      const result = await User.validate({
        name: "John",
        email: "valid@example.com",
        age: 25,
      });
      expect(result).toEqual({ valid: true });
    });
  });

  describe("numeric validator (col.integer with min(0))", () => {
    test("rejects negative age", async () => {
      await expectValidationError(
        User.validate({ name: "John", email: "john@example.com", age: -1 }),
        { age: ["Minimum value is 0"] },
      );
    });

    test("rejects age below boundary", async () => {
      await expectValidationError(
        User.validate({ name: "John", email: "john@example.com", age: -5 }),
        { age: ["Minimum value is 0"] },
      );
    });

    test("allows null age (min validator skips null)", async () => {
      const result = await User.validate({
        name: "John",
        email: "john@example.com",
        age: null as any,
      });
      expect(result).toEqual({ valid: true });
    });
  });

  describe("multiple validation errors across columns", () => {
    test("collects errors from multiple columns when all data is missing", async () => {
      await expectValidationError(User.validate({}), {
        name: ["Value is required"],
        email: ["Value is required"],
      });
    });

    test("collects errors from multiple columns with mixed invalid data", async () => {
      await expectValidationError(
        User.validate({ name: "", email: "bad", age: -1 }),
        {
          name: ["Value is required"],
          email: ["Invalid email"],
          age: ["Minimum value is 0"],
        },
      );
    });
  });

  describe("Model.validate throws ValidationError", () => {
    test("throws ValidationError with correct errors structure for invalid data", async () => {
      try {
        await User.validate({ name: "", email: "", age: -1 });
        fail("Expected ValidationError");
      } catch (e: unknown) {
        expect(e).toBeInstanceOf(ValidationError);
        const ve = e as ValidationError;
        expect(ve.errors).toEqual({
          name: ["Value is required"],
          email: ["Value is required", "Invalid email"],
          age: ["Minimum value is 0"],
        });
      }
    });
  });
});
