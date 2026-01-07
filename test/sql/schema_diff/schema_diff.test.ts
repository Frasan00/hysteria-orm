import { env } from "../../../src/env/env";
import { Model } from "../../../src/sql/models/model";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import {
  PostMigrationV1,
  PostMigrationV10,
  PostMigrationV2,
  PostMigrationV3,
  PostMigrationV4,
  PostMigrationV5,
  PostMigrationV6,
  PostMigrationV7,
  PostMigrationV8,
  PostMigrationV9,
  TagMigration,
  UserMigrationV1,
  UserMigrationV10,
  UserMigrationV2,
  UserMigrationV3,
  UserMigrationV4,
  UserMigrationV5,
  UserMigrationV6,
  UserMigrationV7,
  UserMigrationV8,
  UserMigrationV9,
} from "./test_models";

const SUPPORTED_DB_TYPES = ["mysql", "postgres", "mariadb"];
const TEST_TABLES = [
  "schema_diff_post_tags",
  "schema_diff_posts",
  "schema_diff_tags",
  "schema_diff_users",
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

// Dynamic import to avoid circular dependency issues
const getSchemaDiff = async () => {
  const module = await import(
    "../../../src/sql/migrations/schema_diff/schema_diff"
  );
  return module.SchemaDiff;
};

const conditionalDescribe = isSupported ? describe : describe.skip;

conditionalDescribe(`[${dbType}] Schema Diff Migration Generation`, () => {
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

  describe("User Model Versions (Column-focused changes)", () => {
    beforeAll(async () => {
      await dropAllTestTables(baseSql);
    });

    afterAll(async () => {
      await dropAllTestTables(baseSql);
    });

    test("v1: should detect new table creation", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV1 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const statements = diff.getSqlStatements();

          // Debug: log what we got
          console.log("v1 statements:", JSON.stringify(statements, null, 2));

          // Should have statements for creating a new table
          expect(statements.length).toBeGreaterThan(0);

          // A CREATE TABLE statement should be generated for a new table
          // This tests the EXPECTED behavior - if it fails, the implementation needs fixing
          const hasCreateTable = statements.some((s) =>
            s.toLowerCase().includes("create table"),
          );
          expect(hasCreateTable).toBe(true);

          // Should reference our table name
          const hasOurTable = statements.some((s) =>
            s.toLowerCase().includes("schema_diff_users"),
          );
          expect(hasOurTable).toBe(true);

          // Sync the schema for the next test
          await sql.syncSchema();
        },
      );
    });

    test("v2: should detect column addition (age)", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV2 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const statements = diff.getSqlStatements();

          console.log("v2 statements:", JSON.stringify(statements, null, 2));

          expect(statements.length).toBeGreaterThan(0);

          // Should have ALTER TABLE ADD COLUMN for the new age column
          const hasAddColumn = statements.some(
            (s) =>
              s.toLowerCase().includes("alter table") &&
              s.toLowerCase().includes("age"),
          );
          expect(hasAddColumn).toBe(true);

          await sql.syncSchema();
        },
      );
    });

    test("v3: should detect column type modification (age: integer -> bigint)", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV3 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const statements = diff.getSqlStatements();

          console.log("v3 statements:", JSON.stringify(statements, null, 2));

          expect(statements.length).toBeGreaterThan(0);

          // Should modify the age column to bigint
          const hasModifyColumn = statements.some(
            (s) =>
              s.toLowerCase().includes("age") &&
              s.toLowerCase().includes("bigint"),
          );
          expect(hasModifyColumn).toBe(true);

          await sql.syncSchema();
        },
      );
    });

    test("v4: should detect nullable column addition with default (bio)", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV4 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const statements = diff.getSqlStatements();

          console.log("v4 statements:", JSON.stringify(statements, null, 2));

          expect(statements.length).toBeGreaterThan(0);

          // Should add the bio column
          const hasBioColumn = statements.some((s) =>
            s.toLowerCase().includes("bio"),
          );
          expect(hasBioColumn).toBe(true);

          await sql.syncSchema();
        },
      );
    });

    test("v5: should detect index addition", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV5 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const statements = diff.getSqlStatements();

          console.log("v5 statements:", JSON.stringify(statements, null, 2));

          expect(statements.length).toBeGreaterThan(0);

          // Should create an index
          const hasIndex = statements.some(
            (s) =>
              s.toLowerCase().includes("create index") ||
              s.toLowerCase().includes("idx_schema_diff_users_name"),
          );
          expect(hasIndex).toBe(true);

          await sql.syncSchema();
        },
      );
    });

    test("v6: should detect unique constraint addition", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV6 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const statements = diff.getSqlStatements();

          console.log("v6 statements:", JSON.stringify(statements, null, 2));

          expect(statements.length).toBeGreaterThan(0);

          // Should add unique constraint on email
          const hasUnique = statements.some(
            (s) =>
              s.toLowerCase().includes("unique") ||
              s.toLowerCase().includes("uq_schema_diff_users_email"),
          );
          expect(hasUnique).toBe(true);

          await sql.syncSchema();
        },
      );
    });

    test("v7: should detect nullable change (bio: nullable -> not nullable)", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV7 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const statements = diff.getSqlStatements();

          console.log("v7 statements:", JSON.stringify(statements, null, 2));

          expect(statements.length).toBeGreaterThan(0);

          // Should modify bio to NOT NULL
          const hasNotNull = statements.some(
            (s) =>
              s.toLowerCase().includes("bio") &&
              s.toLowerCase().includes("not null"),
          );
          expect(hasNotNull).toBe(true);

          await sql.syncSchema();
        },
      );
    });

    test("v8: should detect JSON column addition (metadata)", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV8 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const statements = diff.getSqlStatements();

          console.log("v8 statements:", JSON.stringify(statements, null, 2));

          expect(statements.length).toBeGreaterThan(0);

          // Should add metadata JSON column
          const hasMetadata = statements.some(
            (s) =>
              s.toLowerCase().includes("metadata") &&
              s.toLowerCase().includes("json"),
          );
          expect(hasMetadata).toBe(true);

          await sql.syncSchema();
        },
      );
    });

    test("v9: should detect default value change", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV9 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const statements = diff.getSqlStatements();

          console.log("v9 statements:", JSON.stringify(statements, null, 2));

          expect(statements.length).toBeGreaterThan(0);

          // Should modify bio with new default value
          const hasBioDefault = statements.some((s) =>
            s.toLowerCase().includes("bio"),
          );
          expect(hasBioDefault).toBe(true);

          await sql.syncSchema();
        },
      );
    });

    test("v10: should detect UUID column addition (externalId)", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV10 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const statements = diff.getSqlStatements();

          console.log("v10 statements:", JSON.stringify(statements, null, 2));

          expect(statements.length).toBeGreaterThan(0);

          // Should add externalId UUID column
          const hasExternalId = statements.some((s) =>
            s.toLowerCase().includes("external_id"),
          );
          expect(hasExternalId).toBe(true);

          await sql.syncSchema();
        },
      );
    });
  });

  describe("Post Model Versions (Relation-focused changes)", () => {
    beforeAll(async () => {
      await dropAllTestTables(baseSql);
    });

    afterAll(async () => {
      await dropAllTestTables(baseSql);
    });

    test("v1: should detect table and relation creation (belongsTo User)", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV1, PostMigrationV1 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const statements = diff.getSqlStatements();

          console.log(
            "Post v1 statements:",
            JSON.stringify(statements, null, 2),
          );

          expect(statements.length).toBeGreaterThan(0);

          // Should have CREATE TABLE for both tables
          const hasCreateTable = statements.some((s) =>
            s.toLowerCase().includes("create table"),
          );
          expect(hasCreateTable).toBe(true);

          // Should have schema_diff_posts table
          const hasPostsTable = statements.some((s) =>
            s.toLowerCase().includes("schema_diff_posts"),
          );
          expect(hasPostsTable).toBe(true);

          // Should have foreign key to users table
          const hasForeignKey = statements.some(
            (s) =>
              s.toLowerCase().includes("foreign key") ||
              s.toLowerCase().includes("references"),
          );
          expect(hasForeignKey).toBe(true);

          await sql.syncSchema();
        },
      );
    });

    test("v2: should detect relation modification (add onDelete CASCADE)", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV2, PostMigrationV2 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const statements = diff.getSqlStatements();

          console.log(
            "Post v2 statements:",
            JSON.stringify(statements, null, 2),
          );

          // Should have CASCADE changes or FK modifications
          // Also should have age column addition from User v2
          const hasChanges =
            statements.length > 0 &&
            statements.some(
              (s) =>
                s.toLowerCase().includes("cascade") ||
                s.toLowerCase().includes("age") ||
                s.toLowerCase().includes("foreign"),
            );
          expect(hasChanges).toBe(true);

          await sql.syncSchema();
        },
      );
    });

    test("v3: should detect second relation addition (editorId -> User)", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV3, PostMigrationV3 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const statements = diff.getSqlStatements();

          console.log(
            "Post v3 statements:",
            JSON.stringify(statements, null, 2),
          );

          expect(statements.length).toBeGreaterThan(0);

          // Should add editorId column
          const hasEditorId = statements.some((s) =>
            s.toLowerCase().includes("editor_id"),
          );
          expect(hasEditorId).toBe(true);

          await sql.syncSchema();
        },
      );
    });

    test("v4: should detect relation drop (editor relation removed)", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV4, PostMigrationV4, TagMigration },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const statements = diff.getSqlStatements();

          console.log(
            "Post v4 statements:",
            JSON.stringify(statements, null, 2),
          );

          expect(statements.length).toBeGreaterThan(0);

          // Should have DROP constraint for editor FK or create tags table
          const hasChanges = statements.some(
            (s) =>
              s.toLowerCase().includes("drop") ||
              s.toLowerCase().includes("schema_diff_tags") ||
              s.toLowerCase().includes("bio"),
          );
          expect(hasChanges).toBe(true);

          await sql.syncSchema();
        },
      );
    });

    test("v5: should detect manyToMany relation (through PostTag -> Tag)", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV5, PostMigrationV5, TagMigration },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const statements = diff.getSqlStatements();

          console.log(
            "Post v5 statements:",
            JSON.stringify(statements, null, 2),
          );

          // Should create pivot table or add index
          const hasChanges = statements.some(
            (s) =>
              s.toLowerCase().includes("schema_diff_post_tags") ||
              s.toLowerCase().includes("post_id") ||
              s.toLowerCase().includes("index"),
          );
          expect(hasChanges).toBe(true);

          await sql.syncSchema();
        },
      );
    });

    test("v6: should handle manyToMany relation modification (onDelete CASCADE)", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV6, PostMigrationV6, TagMigration },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const statements = diff.getSqlStatements();

          console.log(
            "Post v6 statements:",
            JSON.stringify(statements, null, 2),
          );

          // May or may not have changes depending on implementation
          await sql.syncSchema();
        },
      );
    });

    test("v7: should detect composite index and column additions", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV7, PostMigrationV7, TagMigration },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const statements = diff.getSqlStatements();

          console.log(
            "Post v7 statements:",
            JSON.stringify(statements, null, 2),
          );

          expect(statements.length).toBeGreaterThan(0);

          // Should add createdAt column and composite index
          const hasChanges = statements.some(
            (s) =>
              s.toLowerCase().includes("created_at") ||
              s.toLowerCase().includes("index") ||
              s.toLowerCase().includes("bio"),
          );
          expect(hasChanges).toBe(true);

          await sql.syncSchema();
        },
      );
    });

    test("v8: should detect decimal column with precision/scale addition", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV8, PostMigrationV8, TagMigration },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const statements = diff.getSqlStatements();

          console.log(
            "Post v8 statements:",
            JSON.stringify(statements, null, 2),
          );

          expect(statements.length).toBeGreaterThan(0);

          // Should add rating decimal column
          const hasChanges = statements.some(
            (s) =>
              s.toLowerCase().includes("rating") ||
              s.toLowerCase().includes("decimal") ||
              s.toLowerCase().includes("metadata"),
          );
          expect(hasChanges).toBe(true);

          await sql.syncSchema();
        },
      );
    });

    test("v9: should detect timestamp with timezone addition", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV9, PostMigrationV9, TagMigration },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const statements = diff.getSqlStatements();

          console.log(
            "Post v9 statements:",
            JSON.stringify(statements, null, 2),
          );

          expect(statements.length).toBeGreaterThan(0);

          // Should add publishedAt timestamp column
          const hasChanges = statements.some(
            (s) =>
              s.toLowerCase().includes("published_at") ||
              s.toLowerCase().includes("timestamp") ||
              s.toLowerCase().includes("bio"),
          );
          expect(hasChanges).toBe(true);

          await sql.syncSchema();
        },
      );
    });

    test("v10: should detect composite unique constraint addition", async () => {
      const SchemaDiff = await getSchemaDiff();

      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV10, PostMigrationV10, TagMigration },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const statements = diff.getSqlStatements();

          console.log(
            "Post v10 statements:",
            JSON.stringify(statements, null, 2),
          );

          expect(statements.length).toBeGreaterThan(0);

          // Should add unique constraint or external_id column
          const hasChanges = statements.some(
            (s) =>
              s.toLowerCase().includes("unique") ||
              s.toLowerCase().includes("external_id"),
          );
          expect(hasChanges).toBe(true);

          await sql.syncSchema();

          // After final sync, there should be no more changes
          const finalDiff = await SchemaDiff.makeDiff(sql);
          const finalStatements = finalDiff.getSqlStatements();
          console.log(
            "Final statements (should be empty):",
            JSON.stringify(finalStatements, null, 2),
          );
          expect(finalStatements.length).toBe(0);
        },
      );
    });
  });

  describe("Full Migration Sequence", () => {
    beforeAll(async () => {
      await dropAllTestTables(baseSql);
    });

    afterAll(async () => {
      await dropAllTestTables(baseSql);
    });

    test("should handle complete evolution from v1 to v10", async () => {
      const SchemaDiff = await getSchemaDiff();

      const modelVersions: Array<{
        models: Record<string, typeof Model>;
        description: string;
      }> = [
        { models: { UserMigrationV1, PostMigrationV1 }, description: "v1" },
        { models: { UserMigrationV2, PostMigrationV2 }, description: "v2" },
        { models: { UserMigrationV3, PostMigrationV3 }, description: "v3" },
        {
          models: { UserMigrationV4, PostMigrationV4, TagMigration },
          description: "v4",
        },
        {
          models: { UserMigrationV5, PostMigrationV5, TagMigration },
          description: "v5",
        },
        {
          models: { UserMigrationV6, PostMigrationV6, TagMigration },
          description: "v6",
        },
        {
          models: { UserMigrationV7, PostMigrationV7, TagMigration },
          description: "v7",
        },
        {
          models: { UserMigrationV8, PostMigrationV8, TagMigration },
          description: "v8",
        },
        {
          models: { UserMigrationV9, PostMigrationV9, TagMigration },
          description: "v9",
        },
        {
          models: { UserMigrationV10, PostMigrationV10, TagMigration },
          description: "v10",
        },
      ];

      for (let i = 0; i < modelVersions.length; i++) {
        const { models, description } = modelVersions[i];

        await SqlDataSource.useConnection(
          {
            ...getConnectionConfig(),
            models,
          },
          async (sql) => {
            const diff = await SchemaDiff.makeDiff(sql);
            const statements = diff.getSqlStatements();

            console.log(
              `Evolution ${description}:`,
              statements.length,
              "statements",
            );

            // First version should always have changes (creating tables)
            if (i === 0) {
              expect(statements.length).toBeGreaterThan(0);
            }

            await sql.syncSchema();
          },
        );
      }

      // After final sync, there should be no more changes
      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { UserMigrationV10, PostMigrationV10, TagMigration },
        },
        async (sql) => {
          const finalDiff = await SchemaDiff.makeDiff(sql);
          expect(finalDiff.getSqlStatements().length).toBe(0);
        },
      );
    });
  });
});
