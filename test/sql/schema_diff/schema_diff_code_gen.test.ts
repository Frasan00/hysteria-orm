import {
  ExecutionPhase,
  MigrationOperation,
  OperationType,
} from "../../../src/sql/migrations/schema_diff/schema_diff_types";
import { GenerateMigrationTemplate } from "../../../src/cli/resources/generate_migration_template";
import { env } from "../../../src/env/env";
import { Model } from "../../../src/sql/models/model";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import {
  UserMigrationV1,
  UserMigrationV2,
  UserMigrationV3,
  UserMigrationV5,
  UserMigrationV6,
  PostMigrationV1,
  PostMigrationV2,
  TagMigration,
  CheckModelV1,
  CheckModelV2,
  DecoratorShortcutsModel,
  UnsignedV1,
  UnsignedV2,
} from "./test_models";

const SUPPORTED_DB_TYPES = ["mysql", "postgres", "mariadb"];
const TEST_TABLES = [
  "schema_diff_post_tags",
  "schema_diff_posts",
  "schema_diff_tags",
  "schema_diff_users",
  "schema_diff_decorator_shortcuts",
  "schema_diff_check_items",
  "schema_diff_unsigned",
];

const dbType = env.DB_TYPE || "mysql";
const isSupported = SUPPORTED_DB_TYPES.includes(dbType);

type SupportedDbType = "mysql" | "postgres" | "mariadb";

const getConnectionConfig = () => ({
  type: dbType as SupportedDbType,
  host: env.DB_HOST || "localhost",
  port: Number(env.DB_PORT) || undefined,
  username: env.DB_USER || "root",
  password: env.DB_PASSWORD || "root",
  database: env.DB_DATABASE || "test",
  logs: env.DB_LOGS,
});

const dropAllTestTables = async (sql: SqlDataSource) => {
  for (const table of TEST_TABLES) {
    try {
      await sql.rawQuery(`DROP TABLE IF EXISTS ${table} CASCADE`);
    } catch {
      try {
        await sql.rawQuery(`DROP TABLE IF EXISTS ${table}`);
      } catch {
        // Ignore errors during cleanup
      }
    }
  }
};

const getSchemaDiff = async () => {
  const module =
    await import("../../../src/sql/migrations/schema_diff/schema_diff");
  return module.SchemaDiff;
};

const conditionalDescribe = isSupported ? describe : describe.skip;

conditionalDescribe(`[${dbType}] Schema Diff Code Generation`, () => {
  let baseSql: SqlDataSource;

  beforeAll(async () => {
    baseSql = new SqlDataSource(getConnectionConfig());
    await baseSql.connect();
    await dropAllTestTables(baseSql);
  });

  afterAll(async () => {
    await dropAllTestTables(baseSql);
    await baseSql.disconnect();
  });

  describe("Code generation for table creation", () => {
    beforeAll(async () => {
      await dropAllTestTables(baseSql);
    });

    afterAll(async () => {
      await dropAllTestTables(baseSql);
    });

    test("should generate createTable code for new table", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV1 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const codeStatements = diff.getCodeStatements();

          expect(codeStatements.up.length).toBeGreaterThan(0);
          expect(codeStatements.down.length).toBeGreaterThan(0);

          const upCode = codeStatements.up.join("\n");
          const downCode = codeStatements.down.join("\n");

          // Should use createTable builder API
          expect(upCode).toContain("this.schema.createTable(");
          expect(upCode).toContain("schema_diff_users");

          // Should contain column builder calls
          expect(upCode).toContain("table.");

          // Down should contain dropTable
          expect(downCode).toContain("this.schema.dropTable(");
          expect(downCode).toContain("schema_diff_users");

          await sql.syncSchema();
        },
      );
    });

    test("should generate addColumn code for new column", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV2 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const codeStatements = diff.getCodeStatements();

          expect(codeStatements.up.length).toBeGreaterThan(0);

          const upCode = codeStatements.up.join("\n");

          // Should use alterTable with addColumn
          expect(upCode).toContain("this.schema.alterTable(");
          expect(upCode).toContain("addColumn");
          expect(upCode).toContain("age");

          // Down should contain dropColumn
          const downCode = codeStatements.down.join("\n");
          expect(downCode).toContain("dropColumn");

          await sql.syncSchema();
        },
      );
    });

    test("should generate alterColumn code for type modification", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV3 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const codeStatements = diff.getCodeStatements();

          expect(codeStatements.up.length).toBeGreaterThan(0);

          const upCode = codeStatements.up.join("\n");

          // Should use alterTable with alterColumn
          expect(upCode).toContain("this.schema.alterTable(");
          expect(upCode).toContain("alterColumn");
          expect(upCode).toContain("age");

          await sql.syncSchema();
        },
      );
    });
  });

  describe("Code generation for indexes", () => {
    beforeAll(async () => {
      await dropAllTestTables(baseSql);
    });

    afterAll(async () => {
      await dropAllTestTables(baseSql);
    });

    test("should generate createIndex code", async () => {
      const SchemaDiff = await getSchemaDiff();

      // First create the table
      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV1 },
        },
        async (sql) => {
          await sql.syncSchema();
        },
      );

      // Evolve to v2 (add age column), v3 (modify age), v4 (add bio), then v5 (add index)
      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV2 },
        },
        async (sql) => {
          await sql.syncSchema();
        },
      );

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV3 },
        },
        async (sql) => {
          await sql.syncSchema();
        },
      );

      // UserMigrationV4 adds bio column
      const UserMigrationV4 = (await import("./test_models")).UserMigrationV4;
      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV4 },
        },
        async (sql) => {
          await sql.syncSchema();
        },
      );

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV5 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const codeStatements = diff.getCodeStatements();

          expect(codeStatements.up.length).toBeGreaterThan(0);

          const upCode = codeStatements.up.join("\n");

          // Should use createIndex
          expect(upCode).toContain("this.schema.createIndex(");

          // Down should contain dropIndex
          const downCode = codeStatements.down.join("\n");
          expect(downCode).toContain("this.schema.dropIndex(");

          await sql.syncSchema();
        },
      );
    });
  });

  describe("Code generation for unique constraints", () => {
    beforeAll(async () => {
      await dropAllTestTables(baseSql);
    });

    afterAll(async () => {
      await dropAllTestTables(baseSql);
    });

    test("should generate addUnique code", async () => {
      const SchemaDiff = await getSchemaDiff();

      // Create table first
      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV1 },
        },
        async (sql) => {
          await sql.syncSchema();
        },
      );

      // Evolve through versions up to v6 (unique constraint)
      for (const V of [
        "UserMigrationV2",
        "UserMigrationV3",
        "UserMigrationV4",
        "UserMigrationV5",
      ] as const) {
        const Mod = (await import("./test_models"))[V] as any;
        await SqlDataSource.useConnection(
          {
            ...getConnectionConfig(),
            models: { [V]: Mod },
          },
          async (sql) => {
            await sql.syncSchema();
          },
        );
      }

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV6 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const codeStatements = diff.getCodeStatements();

          expect(codeStatements.up.length).toBeGreaterThan(0);

          const upCode = codeStatements.up.join("\n");

          // Should use addUnique or addConstraint
          expect(
            upCode.includes("this.schema.addUnique(") ||
              upCode.includes("addConstraint"),
          ).toBe(true);

          await sql.syncSchema();
        },
      );
    });
  });

  describe("Code generation for foreign keys", () => {
    beforeAll(async () => {
      await dropAllTestTables(baseSql);
    });

    afterAll(async () => {
      await dropAllTestTables(baseSql);
    });

    test("should generate FK code with createTable and alterTable", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: {
            UserMigrationV1,
            PostMigrationV1,
            TagMigration,
          },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const codeStatements = diff.getCodeStatements();

          expect(codeStatements.up.length).toBeGreaterThan(0);

          const upCode = codeStatements.up.join("\n");

          // Should create tables
          expect(upCode).toContain("this.schema.createTable(");

          // Should have FK via alterTable
          expect(upCode).toContain("foreignKey(");

          await sql.syncSchema();
        },
      );
    });
  });

  describe("Code generation for check constraints", () => {
    beforeAll(async () => {
      await dropAllTestTables(baseSql);
    });

    afterAll(async () => {
      await dropAllTestTables(baseSql);
    });

    test("should generate addCheck code for new check constraint", async () => {
      const SchemaDiff = await getSchemaDiff();

      // Create initial table
      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { CheckModelV1 },
        },
        async (sql) => {
          await sql.syncSchema();
        },
      );

      // Add check constraint
      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { CheckModelV2 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const codeStatements = diff.getCodeStatements();

          if (codeStatements.up.length > 0) {
            const upCode = codeStatements.up.join("\n");

            // Should use addCheck
            expect(upCode).toContain("this.schema.addCheck(");

            // Down should contain dropCheck
            const downCode = codeStatements.down.join("\n");
            expect(downCode).toContain("this.schema.dropCheck(");
          }

          await sql.syncSchema();
        },
      );
    });
  });

  describe("GenerateMigrationTemplate code mode", () => {
    test("should generate template with code mode", async () => {
      const codeStatements = {
        up: [
          "// Structure creation",
          'this.schema.createTable("users", (table) => {',
          '  table.varchar("name");',
          "});",
        ],
        down: ['this.schema.dropTable("users");'],
      };

      const template = await GenerateMigrationTemplate.generate(
        codeStatements,
        "code",
      );

      expect(template).toContain("import { Migration }");
      expect(template).toContain("async up()");
      expect(template).toContain("async down()");
      expect(template).toContain('this.schema.createTable("users"');
      expect(template).toContain('this.schema.dropTable("users")');
      expect(template).not.toContain("rawQuery");
    });

    test("should generate template with raw mode", async () => {
      const sqlStatements = ["CREATE TABLE users (id INT PRIMARY KEY)"];

      const template = await GenerateMigrationTemplate.generate(
        sqlStatements,
        "raw",
      );

      expect(template).toContain("rawQuery");
      expect(template).toContain("CREATE TABLE users");
    });

    test("should default to raw mode for string arrays", async () => {
      const sqlStatements = ["SELECT 1"];

      const template = await GenerateMigrationTemplate.generate(sqlStatements);

      expect(template).toContain("rawQuery");
    });

    test("should auto-detect code mode for object input", async () => {
      const codeStatements = {
        up: ['this.schema.dropTable("test");'],
        down: ['// TODO: reverse table drop for "test"'],
      };

      const template = await GenerateMigrationTemplate.generate(codeStatements);

      expect(template).toContain('this.schema.dropTable("test")');
      expect(template).not.toContain("rawQuery");
    });
  });

  describe("Code generation produces both SQL and code consistently", () => {
    beforeAll(async () => {
      await dropAllTestTables(baseSql);
    });

    afterAll(async () => {
      await dropAllTestTables(baseSql);
    });

    test("both getSqlStatements and getCodeStatements detect same changes", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV1, PostMigrationV1, TagMigration },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const sqlStatements = diff.getSqlStatements();
          const codeStatements = diff.getCodeStatements();

          // Both should detect changes
          expect(sqlStatements.length).toBeGreaterThan(0);
          expect(codeStatements.up.length).toBeGreaterThan(0);

          // Code should not contain any raw SQL
          const upCode = codeStatements.up.join("\n");
          expect(upCode).not.toContain("rawQuery");

          // Code should use schema builder API
          expect(upCode).toContain("this.schema.");
        },
      );
    });
  });
});
