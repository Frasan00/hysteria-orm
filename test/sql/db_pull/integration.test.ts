import dbPullConnector, {
  DbPullOptions,
} from "../../../src/cli/db_pull_connector";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { TableSchemaInfo } from "../../../src/sql/schema_introspection_types";
import {
  IntrospectedSchema,
  IntrospectedTable,
} from "../../../src/sql/introspection_types";
import * as fs from "node:fs";
import * as path from "node:path";

jest.mock("node:fs");

jest.mock("../../../src", () => ({
  SqlDataSource: jest.fn(),
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("db_pull_connector - Integration", () => {
  let mockSqlDs: jest.Mocked<SqlDataSource>;

  const createMockSchema = (tableName: string): TableSchemaInfo => ({
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
        isNullable: true,
        defaultValue: null,
        length: 255,
      },
    ],
    indexes: [{ name: "idx_email", columns: ["email"], isUnique: true }],
    foreignKeys: [],
    primaryKey: { columns: ["id"] },
    checkConstraints: [],
  });

  const createMockTable = (name: string): IntrospectedTable => ({
    name,
    columns: [],
  });

  const createMockSchemaResult = (
    tables: IntrospectedTable[],
  ): IntrospectedSchema[] => [
    {
      dialect: "postgres",
      tables,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockSqlDs = {
      getDbType: jest.fn().mockReturnValue("postgres"),
      introspectSchema: jest
        .fn()
        .mockResolvedValue(
          createMockSchemaResult([
            createMockTable("users"),
            createMockTable("posts"),
          ]),
        ),
      getTableSchema: jest.fn().mockImplementation((tableName: string) => {
        return Promise.resolve(createMockSchema(tableName));
      }),
    } as unknown as jest.Mocked<SqlDataSource>;

    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => undefined);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => undefined);
  });

  describe("Basic flow", () => {
    test("should process all tables and generate model files", async () => {
      const options: DbPullOptions = {
        outDir: "./generated",
        naming: "pascal",
        dry: false,
      };

      await dbPullConnector(mockSqlDs, options);

      expect(mockSqlDs.introspectSchema).toHaveBeenCalledTimes(1);
      expect(mockSqlDs.getTableSchema).toHaveBeenCalledTimes(2);
      expect(mockSqlDs.getTableSchema).toHaveBeenCalledWith("users");
      expect(mockSqlDs.getTableSchema).toHaveBeenCalledWith("posts");
    });

    test("should create output directory if it does not exist", async () => {
      const options: DbPullOptions = {
        outDir: "./generated",
        naming: "pascal",
        dry: false,
      };

      await dbPullConnector(mockSqlDs, options);

      expect(fs.mkdirSync).toHaveBeenCalledWith("./generated", {
        recursive: true,
      });
    });

    test("should not create directory if it already exists", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const options: DbPullOptions = {
        outDir: "./generated",
        naming: "pascal",
        dry: false,
      };

      await dbPullConnector(mockSqlDs, options);

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    test("should write model files for each table", async () => {
      const options: DbPullOptions = {
        outDir: "./generated",
        naming: "pascal",
        dry: false,
      };

      await dbPullConnector(mockSqlDs, options);

      expect(fs.writeFileSync).toHaveBeenCalledTimes(3);

      const calls = (fs.writeFileSync as jest.Mock).mock.calls;
      const filePaths = calls.map((call) => call[0]);

      expect(filePaths).toContain(path.join("./generated", "User.ts"));
      expect(filePaths).toContain(path.join("./generated", "Post.ts"));
      expect(filePaths).toContain(path.join("./generated", "index.ts"));
    });

    test("should generate index.ts barrel file", async () => {
      const options: DbPullOptions = {
        outDir: "./generated",
        naming: "pascal",
        dry: false,
      };

      await dbPullConnector(mockSqlDs, options);

      const calls = (fs.writeFileSync as jest.Mock).mock.calls;
      const indexCall = calls.find((call) => call[0].includes("index.ts"));

      expect(indexCall).toBeDefined();
      expect(indexCall[1]).toContain('export * from "./User"');
      expect(indexCall[1]).toContain('export * from "./Post"');
    });
  });

  describe("Dry run mode", () => {
    test("should not write files in dry run mode", async () => {
      const options: DbPullOptions = {
        outDir: "./generated",
        naming: "pascal",
        dry: true,
      };

      await dbPullConnector(mockSqlDs, options);

      expect(fs.writeFileSync).not.toHaveBeenCalled();
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    test("should not create directory in dry run mode", async () => {
      const options: DbPullOptions = {
        outDir: "./generated",
        naming: "pascal",
        dry: true,
      };

      await dbPullConnector(mockSqlDs, options);

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe("System table filtering", () => {
    test("should skip PostgreSQL system tables", async () => {
      mockSqlDs.introspectSchema.mockResolvedValue(
        createMockSchemaResult([
          createMockTable("users"),
          createMockTable("pg_stat_user_tables"),
          createMockTable("information_schema.tables"),
        ]),
      );

      const options: DbPullOptions = {
        outDir: "./generated",
        naming: "pascal",
        dry: false,
      };

      await dbPullConnector(mockSqlDs, options);

      expect(mockSqlDs.getTableSchema).toHaveBeenCalledTimes(1);
      expect(mockSqlDs.getTableSchema).toHaveBeenCalledWith("users");
    });

    test("should skip MySQL system tables", async () => {
      mockSqlDs.introspectSchema.mockResolvedValue(
        createMockSchemaResult([
          createMockTable("users"),
          createMockTable("mysql.user"),
          createMockTable("performance_schema.events"),
        ]),
      );

      const options: DbPullOptions = {
        outDir: "./generated",
        naming: "pascal",
        dry: false,
      };

      await dbPullConnector(mockSqlDs, options);

      expect(mockSqlDs.getTableSchema).toHaveBeenCalledTimes(1);
      expect(mockSqlDs.getTableSchema).toHaveBeenCalledWith("users");
    });

    test("should skip SQLite system tables", async () => {
      mockSqlDs.introspectSchema.mockResolvedValue(
        createMockSchemaResult([
          createMockTable("users"),
          createMockTable("sqlite_sequence"),
        ]),
      );

      const options: DbPullOptions = {
        outDir: "./generated",
        naming: "pascal",
        dry: false,
      };

      await dbPullConnector(mockSqlDs, options);

      expect(mockSqlDs.getTableSchema).toHaveBeenCalledTimes(1);
      expect(mockSqlDs.getTableSchema).toHaveBeenCalledWith("users");
    });
  });

  describe("Empty database handling", () => {
    test("should handle empty introspection result", async () => {
      mockSqlDs.introspectSchema.mockResolvedValue([]);

      const options: DbPullOptions = {
        outDir: "./generated",
        naming: "pascal",
        dry: false,
      };

      await dbPullConnector(mockSqlDs, options);

      expect(mockSqlDs.getTableSchema).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    test("should handle database with only system tables", async () => {
      mockSqlDs.introspectSchema.mockResolvedValue(
        createMockSchemaResult([createMockTable("pg_catalog.pg_tables")]),
      );

      const options: DbPullOptions = {
        outDir: "./generated",
        naming: "pascal",
        dry: false,
      };

      await dbPullConnector(mockSqlDs, options);

      expect(mockSqlDs.getTableSchema).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    test("should skip tables with no columns", async () => {
      mockSqlDs.getTableSchema.mockImplementation((tableName: string) => {
        if (tableName === "empty_table") {
          return Promise.resolve({
            columns: [],
            indexes: [],
            foreignKeys: [],
            checkConstraints: [],
          } as TableSchemaInfo);
        }
        return Promise.resolve(createMockSchema(tableName));
      });

      mockSqlDs.introspectSchema.mockResolvedValue(
        createMockSchemaResult([
          createMockTable("users"),
          createMockTable("empty_table"),
        ]),
      );

      const options: DbPullOptions = {
        outDir: "./generated",
        naming: "pascal",
        dry: false,
      };

      await dbPullConnector(mockSqlDs, options);

      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    });
  });

  describe("Error handling", () => {
    test("should handle errors for individual tables gracefully", async () => {
      mockSqlDs.getTableSchema.mockImplementation((tableName: string) => {
        if (tableName === "broken_table") {
          return Promise.reject(new Error("Table does not exist"));
        }
        return Promise.resolve(createMockSchema(tableName));
      });

      mockSqlDs.introspectSchema.mockResolvedValue(
        createMockSchemaResult([
          createMockTable("users"),
          createMockTable("broken_table"),
        ]),
      );

      const options: DbPullOptions = {
        outDir: "./generated",
        naming: "pascal",
        dry: false,
      };

      await dbPullConnector(mockSqlDs, options);

      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    });
  });

  describe("Naming conventions", () => {
    test("should use camelCase naming convention", async () => {
      const options: DbPullOptions = {
        outDir: "./generated",
        naming: "camel",
        dry: false,
      };

      await dbPullConnector(mockSqlDs, options);

      const calls = (fs.writeFileSync as jest.Mock).mock.calls;
      const filePaths = calls.map((call) => call[0]);

      expect(filePaths).toContain(path.join("./generated", "user.ts"));
      expect(filePaths).toContain(path.join("./generated", "post.ts"));
    });

    test("should use snake_case naming convention", async () => {
      const options: DbPullOptions = {
        outDir: "./generated",
        naming: "snake",
        dry: false,
      };

      await dbPullConnector(mockSqlDs, options);

      const calls = (fs.writeFileSync as jest.Mock).mock.calls;
      const filePaths = calls.map((call) => call[0]);

      expect(filePaths).toContain(path.join("./generated", "user.ts"));
      expect(filePaths).toContain(path.join("./generated", "post.ts"));
    });
  });

  describe("Generated content validation", () => {
    test("should generate valid TypeScript model code", async () => {
      const options: DbPullOptions = {
        outDir: "./generated",
        naming: "pascal",
        dry: false,
      };

      await dbPullConnector(mockSqlDs, options);

      const calls = (fs.writeFileSync as jest.Mock).mock.calls;
      const userFileCall = calls.find((call) => call[0].includes("User.ts"));

      expect(userFileCall).toBeDefined();
      const content = userFileCall[1];

      expect(content).toContain(
        'import { col, defineModel } from "hysteria-orm"',
      );
      expect(content).toContain("export const users = defineModel");
      expect(content).toContain("columns: {");
      expect(content).toContain("id: col.integer({ nullable: false })");
      expect(content).toContain(
        "name: col.string({ nullable: false, length: 255 })",
      );
      expect(content).toContain("export type usersType");
    });

    test("should include indexes in generated code", async () => {
      const options: DbPullOptions = {
        outDir: "./generated",
        naming: "pascal",
        dry: false,
      };

      await dbPullConnector(mockSqlDs, options);

      const calls = (fs.writeFileSync as jest.Mock).mock.calls;
      const userFileCall = calls.find((call) => call[0].includes("User.ts"));

      expect(userFileCall).toBeDefined();
      const content = userFileCall[1];

      expect(content).toContain("uniques: [");
      expect(content).toContain('"email"');
    });
  });
});
