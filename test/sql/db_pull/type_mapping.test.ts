import {
  mapColumnType,
  TypeMappingResult,
} from "../../../src/cli/resources/db_pull_type_map";
import { TableColumnInfo } from "../../../src/sql/schema_introspection_types";

describe("db_pull_type_map - mapColumnType", () => {
  describe("PostgreSQL type mappings", () => {
    test("should map varchar to string method", () => {
      const column: TableColumnInfo = {
        name: "username",
        dataType: "varchar",
        isNullable: true,
        defaultValue: null,
        length: 255,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("string");
    });

    test("should map character to string method", () => {
      const column: TableColumnInfo = {
        name: "code",
        dataType: "character",
        isNullable: true,
        defaultValue: null,
        length: 10,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("string");
    });

    test("should map text to text method", () => {
      const column: TableColumnInfo = {
        name: "description",
        dataType: "text",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("text");
    });

    test("should map integer to integer method", () => {
      const column: TableColumnInfo = {
        name: "count",
        dataType: "integer",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("integer");
    });

    test("should map int to integer method", () => {
      const column: TableColumnInfo = {
        name: "amount",
        dataType: "int",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("integer");
    });

    test("should map int4 to integer method", () => {
      const column: TableColumnInfo = {
        name: "value",
        dataType: "int4",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("integer");
    });

    test("should map bigint to bigInteger method", () => {
      const column: TableColumnInfo = {
        name: "big_id",
        dataType: "bigint",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("bigInteger");
    });

    test("should map int8 to bigInteger method", () => {
      const column: TableColumnInfo = {
        name: "identifier",
        dataType: "int8",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("bigInteger");
    });

    test("should map smallint to smallint method", () => {
      const column: TableColumnInfo = {
        name: "tiny_value",
        dataType: "smallint",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("smallint");
    });

    test("should map int2 to smallint method", () => {
      const column: TableColumnInfo = {
        name: "small_code",
        dataType: "int2",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("smallint");
    });

    test("should map boolean to boolean method", () => {
      const column: TableColumnInfo = {
        name: "is_active",
        dataType: "boolean",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("boolean");
    });

    test("should map bool to boolean method", () => {
      const column: TableColumnInfo = {
        name: "enabled",
        dataType: "bool",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("boolean");
    });

    test("should map timestamp to timestamp method", () => {
      const column: TableColumnInfo = {
        name: "created_at",
        dataType: "timestamp",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("timestamp");
    });

    test("should map timestamp with timezone to timestamp with withTimezone option", () => {
      const column: TableColumnInfo = {
        name: "modified_at",
        dataType: "timestamp with time zone",
        isNullable: true,
        defaultValue: null,
        withTimezone: true,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("timestamp");
      expect(result.options.withTimezone).toBe(true);
    });

    test("should map date to date method", () => {
      const column: TableColumnInfo = {
        name: "birth_date",
        dataType: "date",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("date");
    });

    test("should map time to time method", () => {
      const column: TableColumnInfo = {
        name: "start_time",
        dataType: "time",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("time");
    });

    test("should map uuid to uuid method", () => {
      const column: TableColumnInfo = {
        name: "uuid_col",
        dataType: "uuid",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("uuid");
    });

    test("should map json to json method", () => {
      const column: TableColumnInfo = {
        name: "metadata",
        dataType: "json",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("json");
    });

    test("should map jsonb to jsonb method", () => {
      const column: TableColumnInfo = {
        name: "data",
        dataType: "jsonb",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("jsonb");
    });

    test("should map decimal to decimal method", () => {
      const column: TableColumnInfo = {
        name: "price",
        dataType: "decimal",
        isNullable: true,
        defaultValue: null,
        precision: 10,
        scale: 2,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("decimal");
    });

    test("should map numeric to decimal method", () => {
      const column: TableColumnInfo = {
        name: "amount",
        dataType: "numeric",
        isNullable: true,
        defaultValue: null,
        precision: 15,
        scale: 4,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("decimal");
    });

    test("should map float to float method", () => {
      const column: TableColumnInfo = {
        name: "rating",
        dataType: "float",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("float");
    });

    test("should map real to float method", () => {
      const column: TableColumnInfo = {
        name: "score",
        dataType: "real",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("float");
    });

    test("should map double precision to float method", () => {
      const column: TableColumnInfo = {
        name: "double_val",
        dataType: "double precision",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("float");
    });

    test("should map bytea to binary method", () => {
      const column: TableColumnInfo = {
        name: "binary_data",
        dataType: "bytea",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("binary");
    });

    test("should map enum to enum method with enumValues", () => {
      const column: TableColumnInfo = {
        name: "status",
        dataType: "enum",
        isNullable: true,
        defaultValue: null,
        enumValues: ["active", "inactive", "pending"],
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("enum");
      expect(result.options.enumValues).toEqual([
        "active",
        "inactive",
        "pending",
      ]);
    });
  });

  describe("MySQL type mappings", () => {
    test("should map varchar to string method", () => {
      const column: TableColumnInfo = {
        name: "name",
        dataType: "varchar",
        isNullable: true,
        defaultValue: null,
        length: 255,
      };

      const result = mapColumnType("mysql", column);

      expect(result.method).toBe("string");
    });

    test("should map tinyint(1) to boolean method", () => {
      const column: TableColumnInfo = {
        name: "is_deleted",
        dataType: "tinyint",
        isNullable: true,
        defaultValue: null,
        length: 1,
      };

      const result = mapColumnType("mysql", column);

      expect(result.method).toBe("boolean");
    });

    test("should map tinyint without length 1 to string (fallback)", () => {
      const column: TableColumnInfo = {
        name: "tiny_val",
        dataType: "tinyint",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("mysql", column);

      expect(result.method).toBe("string");
    });

    test("should set unsigned option for unsigned columns", () => {
      const column: TableColumnInfo = {
        name: "positive_int",
        dataType: "integer",
        isNullable: true,
        defaultValue: null,
        unsigned: true,
      };

      const result = mapColumnType("mysql", column);

      expect(result.options.unsigned).toBe(true);
    });
  });

  describe("Options extraction", () => {
    test("should set nullable option to false when column is not nullable", () => {
      const column: TableColumnInfo = {
        name: "required_field",
        dataType: "varchar",
        isNullable: false,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.options.nullable).toBe(false);
    });

    test("should not set nullable option when column is nullable", () => {
      const column: TableColumnInfo = {
        name: "optional_field",
        dataType: "varchar",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.options.nullable).toBeUndefined();
    });

    test("should set default value for literal defaults", () => {
      const column: TableColumnInfo = {
        name: "status",
        dataType: "varchar",
        isNullable: true,
        defaultValue: "active",
      };

      const result = mapColumnType("postgres", column);

      expect(result.options.default).toBe("active");
    });

    test("should set default value for numeric defaults", () => {
      const column: TableColumnInfo = {
        name: "count",
        dataType: "integer",
        isNullable: true,
        defaultValue: 0,
      };

      const result = mapColumnType("postgres", column);

      expect(result.options.default).toBe(0);
    });

    test("should not set default for SQL expressions like now()", () => {
      const column: TableColumnInfo = {
        name: "created_at",
        dataType: "timestamp",
        isNullable: true,
        defaultValue: "now()",
      };

      const result = mapColumnType("postgres", column);

      expect(result.options.default).toBeUndefined();
    });

    test("should not set default for CURRENT_TIMESTAMP", () => {
      const column: TableColumnInfo = {
        name: "updated_at",
        dataType: "timestamp",
        isNullable: true,
        defaultValue: "CURRENT_TIMESTAMP",
      };

      const result = mapColumnType("postgres", column);

      expect(result.options.default).toBeUndefined();
    });

    test("should set length option when present", () => {
      const column: TableColumnInfo = {
        name: "code",
        dataType: "varchar",
        isNullable: true,
        defaultValue: null,
        length: 50,
      };

      const result = mapColumnType("postgres", column);

      expect(result.options.length).toBe(50);
    });

    test("should set precision option when present", () => {
      const column: TableColumnInfo = {
        name: "price",
        dataType: "decimal",
        isNullable: true,
        defaultValue: null,
        precision: 10,
        scale: 2,
      };

      const result = mapColumnType("postgres", column);

      expect(result.options.precision).toBe(10);
    });

    test("should set scale option when present", () => {
      const column: TableColumnInfo = {
        name: "amount",
        dataType: "decimal",
        isNullable: true,
        defaultValue: null,
        precision: 15,
        scale: 4,
      };

      const result = mapColumnType("postgres", column);

      expect(result.options.scale).toBe(4);
    });
  });

  describe("Edge cases", () => {
    test("should fallback to string for unmapped types", () => {
      const column: TableColumnInfo = {
        name: "custom_col",
        dataType: "custom_type",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("string");
    });

    test("should handle uppercase data types", () => {
      const column: TableColumnInfo = {
        name: "name",
        dataType: "VARCHAR",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("string");
    });

    test("should handle mixed case data types", () => {
      const column: TableColumnInfo = {
        name: "name",
        dataType: "VarChar",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("string");
    });

    test("should handle binary data type", () => {
      const column: TableColumnInfo = {
        name: "blob_data",
        dataType: "binary",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("binary");
    });

    test("should handle double data type", () => {
      const column: TableColumnInfo = {
        name: "double_col",
        dataType: "double",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("float");
    });

    test("should handle multiple options combined", () => {
      const column: TableColumnInfo = {
        name: "status",
        dataType: "varchar",
        isNullable: false,
        defaultValue: "pending",
        length: 100,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("string");
      expect(result.options.nullable).toBe(false);
      expect(result.options.default).toBe("pending");
      expect(result.options.length).toBe(100);
    });

    test("should handle null default value", () => {
      const column: TableColumnInfo = {
        name: "optional",
        dataType: "varchar",
        isNullable: true,
        defaultValue: null,
      };

      const result = mapColumnType("postgres", column);

      expect(result.options.default).toBeUndefined();
    });

    test("should handle undefined default value", () => {
      const column: TableColumnInfo = {
        name: "optional",
        dataType: "varchar",
        isNullable: true,
        defaultValue: undefined as any,
      };

      const result = mapColumnType("postgres", column);

      expect(result.options.default).toBeUndefined();
    });

    test("should handle empty enum values", () => {
      const column: TableColumnInfo = {
        name: "status",
        dataType: "enum",
        isNullable: true,
        defaultValue: null,
        enumValues: null as any,
      };

      const result = mapColumnType("postgres", column);

      expect(result.method).toBe("enum");
      expect(result.options.enumValues).toBeUndefined();
    });
  });
});
