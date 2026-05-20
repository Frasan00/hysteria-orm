import { z } from "zod";
import { defineModel, col } from "../../src/sql/models/define_model";
import { SqlDataSource } from "../../src/sql/sql_data_source";

describe("toZodSchema", () => {
  it("should translate a simple model to a zod schema", () => {
    const User = defineModel("users", {
      columns: {
        id: col.increment(),
        name: col.string({ nullable: false }),
        email: col.string(),
        age: col.integer(),
        isActive: col.boolean({ nullable: false }),
        createdAt: col.datetime({ nullable: false }),
        metadata: col.json(),
        status: col.enum(["active", "inactive"] as const, { nullable: false }),
      },
    });

    const sql = new SqlDataSource({ type: "sqlite", database: ":memory:" });
    sql.loadZodEngine(z);

    const schema = User.toZodSchema();

    // Verify schema shape
    const result = schema.safeParse({
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      age: 30,
      isActive: true,
      createdAt: new Date(),
      metadata: { foo: "bar" },
      status: "active",
    });

    expect(result.success).toBe(true);
  });

  it("should handle nullability correctly", () => {
    const User = defineModel("users", {
      columns: {
        id: col.increment(),
        email: col.string(), // default is nullable: true
      },
    });

    const schema = User.toZodSchema();

    const result = schema.safeParse({
      id: 1,
      email: null,
    });

    expect(result.success).toBe(true);
  });

  it("should fail validation for incorrect types", () => {
    const User = defineModel("users", {
      columns: {
        id: col.increment(),
        name: col.string({ nullable: false }),
      },
    });

    const schema = User.toZodSchema();

    const result = schema.safeParse({
      id: "not-a-number",
      name: null,
    });

    expect(result.success).toBe(false);
  });

  it("should handle enums correctly", () => {
    const User = defineModel("users", {
      columns: {
        status: col.enum(["active", "inactive"] as const, { nullable: false }),
      },
    });

    const schema = User.toZodSchema();

    expect(schema.safeParse({ status: "active" }).success).toBe(true);
    expect(schema.safeParse({ status: "inactive" }).success).toBe(true);
    expect(schema.safeParse({ status: "pending" }).success).toBe(false);
  });
});
