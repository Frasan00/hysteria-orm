import {
  generateModelCode,
  generateIndexTs,
} from "../../../src/cli/resources/model_code_generator";
import {
  TableSchemaInfo,
  TableColumnInfo,
} from "../../../src/sql/schema_introspection_types";

describe("model_code_generator - generateModelCode", () => {
  const createBasicColumn = (
    name: string,
    dataType: string,
  ): TableColumnInfo => ({
    name,
    dataType,
    isNullable: true,
    defaultValue: null,
  });

  describe("Basic model generation", () => {
    test("should generate valid TypeScript model with basic structure", () => {
      const schema: TableSchemaInfo = {
        columns: [createBasicColumn("id", "integer")],
        indexes: [],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain('import { col, defineModel } from "hysteria-orm"');
      expect(code).toContain("export const users = defineModel");
      expect(code).toContain("columns: {");
      expect(code).toContain("});");
      expect(code).toContain(
        "export type usersType = InstanceType<typeof users>",
      );
    });

    test("should include col.integer() for integer columns", () => {
      const schema: TableSchemaInfo = {
        columns: [createBasicColumn("id", "integer")],
        indexes: [],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("id: col.integer()");
    });

    test("should include col.string() for varchar columns", () => {
      const schema: TableSchemaInfo = {
        columns: [
          {
            name: "name",
            dataType: "varchar",
            isNullable: true,
            defaultValue: null,
            length: 255,
          },
        ],
        indexes: [],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("name: col.string({ length: 255 })");
    });

    test("should include nullable: false for non-nullable columns", () => {
      const schema: TableSchemaInfo = {
        columns: [
          {
            name: "email",
            dataType: "varchar",
            isNullable: false,
            defaultValue: null,
            length: 255,
          },
        ],
        indexes: [],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("nullable: false");
    });

    test("should include default value when present", () => {
      const schema: TableSchemaInfo = {
        columns: [
          {
            name: "status",
            dataType: "varchar",
            isNullable: true,
            defaultValue: "active",
            length: 50,
          },
        ],
        indexes: [],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain('default: "active"');
    });
  });

  describe("Primary key handling", () => {
    test("should add comment for primary key columns", () => {
      const schema: TableSchemaInfo = {
        columns: [createBasicColumn("id", "integer")],
        indexes: [],
        foreignKeys: [],
        primaryKey: { columns: ["id"] },
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("// Primary key column");
    });

    test("should add TODO comment for potential auto-increment on integer PK", () => {
      const schema: TableSchemaInfo = {
        columns: [createBasicColumn("id", "integer")],
        indexes: [],
        foreignKeys: [],
        primaryKey: { columns: ["id"] },
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("// TODO: may be auto-increment, verify manually");
    });

    test("should add TODO comment for potential auto-increment on bigInteger PK", () => {
      const schema: TableSchemaInfo = {
        columns: [createBasicColumn("id", "bigint")],
        indexes: [],
        foreignKeys: [],
        primaryKey: { columns: ["id"] },
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("// TODO: may be auto-increment, verify manually");
    });

    test("should not add TODO comment for string PK", () => {
      const schema: TableSchemaInfo = {
        columns: [createBasicColumn("id", "uuid")],
        indexes: [],
        foreignKeys: [],
        primaryKey: { columns: ["id"] },
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("// Primary key column");
      expect(code).not.toContain("auto-increment");
    });
  });

  describe("Column sanitization", () => {
    test("should sanitize reserved property names like query", () => {
      const schema: TableSchemaInfo = {
        columns: [createBasicColumn("query", "varchar")],
        indexes: [],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("query_: col.string()");
    });

    test("should sanitize reserved property names like table", () => {
      const schema: TableSchemaInfo = {
        columns: [createBasicColumn("table", "varchar")],
        indexes: [],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("table_: col.string()");
    });

    test("should not sanitize non-reserved names", () => {
      const schema: TableSchemaInfo = {
        columns: [createBasicColumn("my_query", "varchar")],
        indexes: [],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("my_query: col.string()");
    });
  });

  describe("Index generation", () => {
    test("should generate indexes array for non-unique indexes with name", () => {
      const schema: TableSchemaInfo = {
        columns: [
          createBasicColumn("id", "integer"),
          createBasicColumn("email", "varchar"),
        ],
        indexes: [{ name: "idx_email", columns: ["email"], isUnique: false }],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("indexes: [");
      expect(code).toContain('"email"');
      expect(code).toContain('name: "idx_email"');
    });

    test("should generate multiple non-unique indexes", () => {
      const schema: TableSchemaInfo = {
        columns: [
          createBasicColumn("id", "integer"),
          createBasicColumn("email", "varchar"),
          createBasicColumn("name", "varchar"),
        ],
        indexes: [
          { name: "idx_email", columns: ["email"], isUnique: false },
          { name: "idx_name", columns: ["name"], isUnique: false },
        ],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("indexes: [");
      expect(code).toContain('"email"');
      expect(code).toContain('"name"');
    });

    test("should handle composite indexes with name", () => {
      const schema: TableSchemaInfo = {
        columns: [
          createBasicColumn("first_name", "varchar"),
          createBasicColumn("last_name", "varchar"),
        ],
        indexes: [
          {
            name: "idx_name",
            columns: ["first_name", "last_name"],
            isUnique: false,
          },
        ],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain('"first_name", "last_name"');
      expect(code).toContain('name: "idx_name"');
    });

    test("should not include unique indexes in indexes array", () => {
      const schema: TableSchemaInfo = {
        columns: [
          createBasicColumn("id", "integer"),
          createBasicColumn("email", "varchar"),
        ],
        indexes: [{ name: "idx_email", columns: ["email"], isUnique: true }],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).not.toContain("indexes: [");
      expect(code).toContain("uniques: [");
    });
  });

  describe("Unique constraint generation", () => {
    test("should generate uniques array for unique indexes with name", () => {
      const schema: TableSchemaInfo = {
        columns: [
          createBasicColumn("id", "integer"),
          createBasicColumn("email", "varchar"),
        ],
        indexes: [{ name: "idx_email", columns: ["email"], isUnique: true }],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("uniques: [");
      expect(code).toContain('"email"');
      expect(code).toContain('name: "idx_email"');
    });

    test("should generate multiple unique constraints", () => {
      const schema: TableSchemaInfo = {
        columns: [
          createBasicColumn("id", "integer"),
          createBasicColumn("email", "varchar"),
          createBasicColumn("username", "varchar"),
        ],
        indexes: [
          { name: "idx_email", columns: ["email"], isUnique: true },
          { name: "idx_username", columns: ["username"], isUnique: true },
        ],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("uniques: [");
      expect(code).toContain('"email"');
      expect(code).toContain('"username"');
    });

    test("should handle composite unique constraints with name", () => {
      const schema: TableSchemaInfo = {
        columns: [
          createBasicColumn("user_id", "integer"),
          createBasicColumn("role_id", "integer"),
        ],
        indexes: [
          {
            name: "idx_user_role",
            columns: ["user_id", "role_id"],
            isUnique: true,
          },
        ],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain('"user_id", "role_id"');
      expect(code).toContain('name: "idx_user_role"');
    });

    test("should include both indexes and uniques when both exist", () => {
      const schema: TableSchemaInfo = {
        columns: [
          createBasicColumn("id", "integer"),
          createBasicColumn("email", "varchar"),
          createBasicColumn("name", "varchar"),
        ],
        indexes: [
          { name: "idx_email", columns: ["email"], isUnique: true },
          { name: "idx_name", columns: ["name"], isUnique: false },
        ],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("indexes: [");
      expect(code).toContain("uniques: [");
    });
  });

  describe("Named index and unique syntax", () => {
    test("should generate named index with columns and name object", () => {
      const schema: TableSchemaInfo = {
        columns: [
          createBasicColumn("id", "integer"),
          createBasicColumn("user_id", "integer"),
        ],
        indexes: [
          { name: "idx_posts_user_id", columns: ["user_id"], isUnique: false },
        ],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("posts", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("indexes: [");
      expect(code).toContain('columns: ["user_id"]');
      expect(code).toContain('name: "idx_posts_user_id"');
    });

    test("should generate named unique constraint with columns and name object", () => {
      const schema: TableSchemaInfo = {
        columns: [
          createBasicColumn("id", "integer"),
          createBasicColumn("email", "varchar"),
        ],
        indexes: [
          { name: "uniq_users_email", columns: ["email"], isUnique: true },
        ],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("uniques: [");
      expect(code).toContain('columns: ["email"]');
      expect(code).toContain('name: "uniq_users_email"');
    });

    test("should generate composite index with name", () => {
      const schema: TableSchemaInfo = {
        columns: [
          createBasicColumn("post_id", "integer"),
          createBasicColumn("tag", "varchar"),
        ],
        indexes: [
          {
            name: "idx_post_tags",
            columns: ["post_id", "tag"],
            isUnique: false,
          },
        ],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("post_tags", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("indexes: [");
      expect(code).toContain('columns: ["post_id", "tag"]');
      expect(code).toContain('name: "idx_post_tags"');
    });

    test("should fallback to array syntax for unnamed indexes", () => {
      const schema: TableSchemaInfo = {
        columns: [
          createBasicColumn("id", "integer"),
          createBasicColumn("col1", "varchar"),
        ],
        indexes: [{ name: "", columns: ["col1"], isUnique: false }],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("test_table", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("indexes: [");
      expect(code).toContain('["col1"]');
    });
  });

  describe("Foreign key JSDoc generation", () => {
    test("should generate JSDoc comment for columns with foreign keys", () => {
      const schema: TableSchemaInfo = {
        columns: [
          createBasicColumn("id", "integer"),
          createBasicColumn("user_id", "integer"),
        ],
        indexes: [],
        foreignKeys: [
          {
            name: "fk_posts_user",
            columns: ["user_id"],
            referencedTable: "users",
            referencedColumns: ["id"],
          },
        ],
        checkConstraints: [],
      };

      const code = generateModelCode("posts", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("/** @fk references users(id) */");
      expect(code).toContain("user_id");
    });

    test("should handle multiple foreign keys", () => {
      const schema: TableSchemaInfo = {
        columns: [
          createBasicColumn("id", "integer"),
          createBasicColumn("user_id", "integer"),
          createBasicColumn("category_id", "integer"),
        ],
        indexes: [],
        foreignKeys: [
          {
            name: "fk_posts_user",
            columns: ["user_id"],
            referencedTable: "users",
            referencedColumns: ["id"],
          },
          {
            name: "fk_posts_category",
            columns: ["category_id"],
            referencedTable: "categories",
            referencedColumns: ["id"],
          },
        ],
        checkConstraints: [],
      };

      const code = generateModelCode("posts", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("/** @fk references users(id) */");
      expect(code).toContain("/** @fk references categories(id) */");
    });

    test("should handle foreign key with onDelete and onUpdate", () => {
      const schema: TableSchemaInfo = {
        columns: [
          createBasicColumn("id", "integer"),
          createBasicColumn("user_id", "integer"),
        ],
        indexes: [],
        foreignKeys: [
          {
            name: "fk_posts_user",
            columns: ["user_id"],
            referencedTable: "users",
            referencedColumns: ["id"],
            onDelete: "CASCADE",
            onUpdate: "NO ACTION",
          },
        ],
        checkConstraints: [],
      };

      const code = generateModelCode("posts", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain(
        "/** @fk references users(id) — onDelete: CASCADE — onUpdate: NO ACTION */",
      );
    });
  });

  describe("Complex column types", () => {
    test("should handle decimal with precision and scale", () => {
      const schema: TableSchemaInfo = {
        columns: [
          {
            name: "price",
            dataType: "decimal",
            isNullable: true,
            defaultValue: null,
            precision: 10,
            scale: 2,
          },
        ],
        indexes: [],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("products", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("price: col.decimal({ precision: 10, scale: 2 })");
    });

    test("should handle enum with values", () => {
      const schema: TableSchemaInfo = {
        columns: [
          {
            name: "status",
            dataType: "enum",
            isNullable: true,
            defaultValue: null,
            enumValues: ["active", "inactive"],
          },
        ],
        indexes: [],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain(
        'status: col.enum({ enumValues: ["active", "inactive"] })',
      );
    });

    test("should handle timestamp with timezone", () => {
      const schema: TableSchemaInfo = {
        columns: [
          {
            name: "created_at",
            dataType: "timestamp",
            isNullable: true,
            defaultValue: null,
            withTimezone: true,
          },
        ],
        indexes: [],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain(
        "created_at: col.timestamp({ withTimezone: true })",
      );
    });

    test("should handle boolean columns", () => {
      const schema: TableSchemaInfo = {
        columns: [createBasicColumn("is_active", "boolean")],
        indexes: [],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("is_active: col.boolean()");
    });

    test("should handle text columns", () => {
      const schema: TableSchemaInfo = {
        columns: [createBasicColumn("description", "text")],
        indexes: [],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("description: col.text()");
    });

    test("should handle json columns", () => {
      const schema: TableSchemaInfo = {
        columns: [createBasicColumn("metadata", "json")],
        indexes: [],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("metadata: col.json()");
    });

    test("should handle uuid columns", () => {
      const schema: TableSchemaInfo = {
        columns: [createBasicColumn("uuid_col", "uuid")],
        indexes: [],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("uuid_col: col.uuid()");
    });
  });

  describe("Multiple columns", () => {
    test("should generate multiple columns correctly", () => {
      const schema: TableSchemaInfo = {
        columns: [
          {
            name: "id",
            dataType: "integer",
            isNullable: false,
            defaultValue: null,
          },
          {
            name: "name",
            dataType: "varchar",
            isNullable: false,
            defaultValue: null,
            length: 255,
          },
          {
            name: "email",
            dataType: "varchar",
            isNullable: false,
            defaultValue: null,
            length: 255,
          },
          {
            name: "age",
            dataType: "integer",
            isNullable: true,
            defaultValue: null,
          },
        ],
        indexes: [],
        foreignKeys: [],
        checkConstraints: [],
      };

      const code = generateModelCode("users", schema, "postgres", {
        naming: "pascal",
      });

      expect(code).toContain("id: col.integer({ nullable: false })");
      expect(code).toContain(
        "name: col.string({ nullable: false, length: 255 })",
      );
      expect(code).toContain(
        "email: col.string({ nullable: false, length: 255 })",
      );
      expect(code).toContain("age: col.integer()");
    });
  });
});

describe("model_code_generator - generateIndexTs", () => {
  test("should generate empty barrel file for empty model list", () => {
    const code = generateIndexTs([]);

    expect(code).toBe("");
  });

  test("should generate single export for one model", () => {
    const code = generateIndexTs(["User"]);

    expect(code).toContain('export * from "./User";');
  });

  test("should generate exports for multiple models", () => {
    const code = generateIndexTs(["User", "Post", "Category"]);

    expect(code).toContain('export * from "./User";');
    expect(code).toContain('export * from "./Post";');
    expect(code).toContain('export * from "./Category";');
  });

  test("should maintain order of models in exports", () => {
    const models = ["Zebra", "Apple", "Banana"];
    const code = generateIndexTs(models);

    const lines = code.split("\n").filter((line) => line.trim() !== "");
    expect(lines[0]).toBe('export * from "./Zebra";');
    expect(lines[1]).toBe('export * from "./Apple";');
    expect(lines[2]).toBe('export * from "./Banana";');
  });

  test("should end with newline", () => {
    const code = generateIndexTs(["User"]);

    expect(code.endsWith("\n")).toBe(true);
  });
});
