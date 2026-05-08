import {
  required,
  minLength,
  maxLength,
  pattern,
  email,
  url,
  min,
  max,
} from "../../../src/sql/models/validators/builtin_validators";
import type { ValidationContext } from "../../../src/sql/models/validators/validator";

describe("Built-in Validators", () => {
  const ctx: ValidationContext = {
    model: {} as any,
    column: "name",
    operation: "insert",
    data: { name: "ab" },
  };

  describe("required validator", () => {
    test("should reject null", async () => {
      const result = await required(null, ctx);
      expect(result.valid).toBe(false);
    });

    test("should reject undefined", async () => {
      const result = await required(undefined, ctx);
      expect(result.valid).toBe(false);
    });

    test("should reject empty string", async () => {
      const result = await required("", ctx);
      expect(result.valid).toBe(false);
    });

    test("should accept valid string", async () => {
      const result = await required("valid", ctx);
      expect(result.valid).toBe(true);
    });
  });

  describe("minLength validator", () => {
    test("should reject strings shorter than min", async () => {
      const validator = minLength(3);
      const result = await validator("ab", ctx);
      expect(result.valid).toBe(false);
    });

    test("should accept strings meeting min length", async () => {
      const validator = minLength(3);
      const result = await validator("abc", ctx);
      expect(result.valid).toBe(true);
    });
  });

  describe("maxLength validator", () => {
    test("should reject strings longer than max", async () => {
      const validator = maxLength(5);
      const result = await validator("abcdef", ctx);
      expect(result.valid).toBe(false);
    });

    test("should accept strings within max length", async () => {
      const validator = maxLength(5);
      const result = await validator("abcde", ctx);
      expect(result.valid).toBe(true);
    });
  });

  describe("pattern validator", () => {
    test("should reject non-matching values", async () => {
      const validator = pattern(/^foo/);
      const result = await validator("bar", ctx);
      expect(result.valid).toBe(false);
    });

    test("should accept matching values", async () => {
      const validator = pattern(/^foo/);
      const result = await validator("foobar", ctx);
      expect(result.valid).toBe(true);
    });
  });

  describe("email validator", () => {
    test("should reject invalid email", async () => {
      const result = await email("invalid-email", ctx);
      expect(result.valid).toBe(false);
    });

    test("should accept valid email", async () => {
      const result = await email("test@example.com", ctx);
      expect(result.valid).toBe(true);
    });
  });

  describe("url validator", () => {
    test("should reject invalid URL", async () => {
      const result = await url("not-a-url", ctx);
      expect(result.valid).toBe(false);
    });

    test("should accept valid URL", async () => {
      const result = await url("https://example.com", ctx);
      expect(result.valid).toBe(true);
    });
  });

  describe("min validator", () => {
    test("should reject numbers below min", async () => {
      const validator = min(10);
      const result = await validator(5, ctx);
      expect(result.valid).toBe(false);
    });

    test("should accept numbers at or above min", async () => {
      const validator = min(10);
      const result = await validator(10, ctx);
      expect(result.valid).toBe(true);
    });
  });

  describe("max validator", () => {
    test("should reject numbers above max", async () => {
      const validator = max(10);
      const result = await validator(15, ctx);
      expect(result.valid).toBe(false);
    });

    test("should accept numbers at or below max", async () => {
      const validator = max(10);
      const result = await validator(10, ctx);
      expect(result.valid).toBe(true);
    });
  });
});
