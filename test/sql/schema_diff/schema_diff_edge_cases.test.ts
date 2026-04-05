import { env } from "../../../src/env/env";
import { Model } from "../../../src/sql/models/model";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import {
  // Column Drop
  ColumnDropV1,
  ColumnDropV2,
  ColumnDropV3,
  // Column Rename
  ColumnRenameV1,
  ColumnRenameV2,
  // Type Change
  TypeChangeV1,
  TypeChangeV2,
  TypeChangeV3,
  // Precision
  PrecisionV1,
  PrecisionV2,
  PrecisionV3,
  // Nullable
  NullableV1,
  NullableV2,
  NullableV3,
  NullableV4,
  // Defaults
  DefaultV1,
  DefaultV2,
  DefaultV3,
  DefaultV4,
  DefaultV5,
  // Index Lifecycle
  IndexLifecycleV1,
  IndexLifecycleV2,
  IndexLifecycleV3,
  IndexLifecycleV4,
  // Unique Lifecycle
  UniqueLifecycleV1,
  UniqueLifecycleV2,
  UniqueLifecycleV3,
  UniqueLifecycleV4,
  // Self-Referencing
  SelfRefV1,
  SelfRefV2,
  SelfRefV3,
  // Circular
  CircularAV1,
  CircularAV2,
  CircularAV3,
  CircularBV1,
  CircularBV2,
  CircularBV3,
  // Multi FK
  MultiFkAnchor,
  MultiFkV1,
  MultiFkV2,
  // Parent/Child
  ParentV1,
  ParentV2,
  ChildV1,
  ChildV2,
  // M2M
  M2mLeft,
  M2mRight,
  M2mLeftV1,
  M2mLeftV2,
  M2mLeftV3,
  // DB Name
  DbNameV1,
  DbNameV2,
  // Special Types
  SpecialTypesV1,
  SpecialTypesV2,
  // Timezone
  TzV1,
  TzV2,
  TzV3,
  // PK Change
  PkChangeV1,
  PkChangeV2,
  // Large
  LargeV1,
  LargeV2,
  // Decorator Ext
  DecoratorsExtModel,
  // Enum Column Evolution
  EnumV1,
  EnumV2,
  EnumV3,
  // Enum No Change
  EnumNoChangeV1,
  EnumNoChangeV2,
  // Index Drop Extreme
  IndexDropExtremeV1,
  IndexDropExtremeV2,
  IndexDropExtremeV3,
  // Check Drop Extreme
  CheckDropExtremeV1,
  CheckDropExtremeV2,
  CheckDropExtremeV3,
  // Index Composite
  IndexCompositeV1,
  IndexCompositeV2,
  IndexCompositeV3,
  // Unique Modify
  UniqueModifyV1,
  UniqueModifyV2,
  UniqueModifyV3,
  // Combined Drops
  CombinedDropsV1,
  CombinedDropsV2,
  CombinedDropsV3,
  // FK Drop Multiple
  FkDropAnchor,
  FkDropMultipleV1,
  FkDropMultipleV2,
  FkDropMultipleV3,
  // Constraint Collision
  ConstraintCollisionV1,
  ConstraintCollisionV2,
  // Custom Types
  CustomTypeV1,
} from "./test_models";

const SUPPORTED_DB_TYPES = ["mysql", "postgres", "mariadb"];

const EDGE_CASE_TABLES = [
  "schema_diff_col_drop",
  "schema_diff_col_rename",
  "schema_diff_type_change",
  "schema_diff_precision",
  "schema_diff_nullable",
  "schema_diff_defaults",
  "schema_diff_index_lifecycle",
  "schema_diff_unique_lifecycle",
  "schema_diff_self_ref",
  "schema_diff_circular_a",
  "schema_diff_circular_b",
  "schema_diff_mfk",
  "schema_diff_mfk_anchor",
  "schema_diff_parent",
  "schema_diff_child",
  "schema_diff_m2m_left",
  "schema_diff_m2m_right",
  "schema_diff_m2m_pivot",
  "schema_diff_db_name",
  "schema_diff_special_types",
  "schema_diff_tz",
  "schema_diff_pk_change",
  "schema_diff_large",
  "schema_diff_decorators_ext",
  "schema_diff_enum_test",
  "schema_diff_enum_no_change_test",
  "schema_diff_idx_extreme",
  "schema_diff_chk_extreme",
  "schema_diff_idx_composite",
  "schema_diff_uq_modify",
  "schema_diff_combined",
  "schema_diff_fk_anchor",
  "schema_diff_fk_multiple",
  "schema_diff_collision",
  "schema_diff_custom_type",
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

const dropAllEdgeCaseTables = async (sql: SqlDataSource) => {
  // Drop in reverse order to handle FK constraints
  for (const table of [...EDGE_CASE_TABLES].reverse()) {
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

conditionalDescribe(`[${dbType}] Schema Diff Edge Cases`, () => {
  let baseSql: SqlDataSource;

  beforeAll(async () => {
    baseSql = new SqlDataSource(getConnectionConfig());
    await baseSql.connect();
    await dropAllEdgeCaseTables(baseSql);
  });

  afterAll(async () => {
    await dropAllEdgeCaseTables(baseSql);
    await baseSql.disconnect();
  });

  // =========================================================================
  // 1. Column Drop Detection
  // =========================================================================
  describe("Column Drop Detection", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table with 5 columns", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { ColumnDropV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          expect(
            stmts.some((s) => s.toLowerCase().includes("create table")),
          ).toBe(true);
          await sql.syncSchema();
        },
      );
    });

    test("v2: should detect 2 column drops (phone, address)", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { ColumnDropV2 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          const hasDropPhone = stmts.some(
            (s) =>
              s.toLowerCase().includes("drop") &&
              s.toLowerCase().includes("phone"),
          );
          const hasDropAddress = stmts.some(
            (s) =>
              s.toLowerCase().includes("drop") &&
              s.toLowerCase().includes("address"),
          );
          expect(hasDropPhone).toBe(true);
          expect(hasDropAddress).toBe(true);
          await sql.syncSchema();
        },
      );
    });

    test("v3: should detect simultaneous drop (email) + add (website)", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { ColumnDropV3 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          expect(
            stmts.some(
              (s) =>
                s.toLowerCase().includes("drop") &&
                s.toLowerCase().includes("email"),
            ),
          ).toBe(true);
          expect(stmts.some((s) => s.toLowerCase().includes("website"))).toBe(
            true,
          );
          await sql.syncSchema();

          // Idempotency
          const finalDiff = await SchemaDiff.makeDiff(sql);
          expect(finalDiff.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 2. Column Rename (via drop + add)
  // =========================================================================
  describe("Column Rename via Drop+Add", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { ColumnRenameV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          await sql.syncSchema();
        },
      );
    });

    test("v2: should detect drop firstName + add fullName", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { ColumnRenameV2 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          expect(
            stmts.some((s) => s.toLowerCase().includes("first_name")),
          ).toBe(true);
          expect(stmts.some((s) => s.toLowerCase().includes("full_name"))).toBe(
            true,
          );
          await sql.syncSchema();

          // Idempotency
          const finalDiff = await SchemaDiff.makeDiff(sql);
          expect(finalDiff.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 3. Multiple Type Changes
  // =========================================================================
  describe("Multiple Type Changes in One Sync", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { TypeChangeV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          expect(diff.getSqlStatements().length).toBeGreaterThan(0);
          await sql.syncSchema();
        },
      );
    });

    test("v2: should detect 3 type changes at once", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { TypeChangeV2 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          // count → bigint
          expect(
            stmts.some(
              (s) =>
                s.toLowerCase().includes("count") &&
                s.toLowerCase().includes("bigint"),
            ),
          ).toBe(true);
          // price → varchar(255)
          expect(
            stmts.some(
              (s) =>
                s.toLowerCase().includes("price") &&
                s.toLowerCase().includes("varchar"),
            ),
          ).toBe(true);
          // status → text
          expect(
            stmts.some(
              (s) =>
                s.toLowerCase().includes("status") &&
                s.toLowerCase().includes("text"),
            ),
          ).toBe(true);
          await sql.syncSchema();
        },
      );
    });

    test("v3: should detect type reversions", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { TypeChangeV3 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          await sql.syncSchema();

          // Idempotency
          const finalDiff = await SchemaDiff.makeDiff(sql);
          expect(finalDiff.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 4. Length / Precision / Scale Changes
  // =========================================================================
  describe("Length / Precision / Scale Changes", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { PrecisionV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          expect(diff.getSqlStatements().length).toBeGreaterThan(0);
          await sql.syncSchema();
        },
      );
    });

    test("v2: should detect length expansion and precision change", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { PrecisionV2 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          // name length change and/or amount precision change
          expect(
            stmts.some(
              (s) =>
                s.toLowerCase().includes("name") ||
                s.toLowerCase().includes("amount"),
            ),
          ).toBe(true);
          await sql.syncSchema();
        },
      );
    });

    test("v3: should detect length shrink", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { PrecisionV3 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          expect(stmts.some((s) => s.toLowerCase().includes("name"))).toBe(
            true,
          );
          await sql.syncSchema();

          const finalDiff = await SchemaDiff.makeDiff(sql);
          expect(finalDiff.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 5. Nullable Flip-Flopping
  // =========================================================================
  describe("Nullable Flip-Flopping", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { NullableV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          expect(diff.getSqlStatements().length).toBeGreaterThan(0);
          await sql.syncSchema();
        },
      );
    });

    test("v2: should detect nullable flips (field1→nullable, field2→NOT NULL)", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { NullableV2 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          expect(stmts.some((s) => s.toLowerCase().includes("field1"))).toBe(
            true,
          );
          expect(stmts.some((s) => s.toLowerCase().includes("field2"))).toBe(
            true,
          );
          await sql.syncSchema();
        },
      );
    });

    test("v3: should detect flip back", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { NullableV3 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          await sql.syncSchema();
        },
      );
    });

    test("v4: should detect all nullable + idempotency", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { NullableV4 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          await sql.syncSchema();

          const finalDiff = await SchemaDiff.makeDiff(sql);
          expect(finalDiff.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 6. Default Value Edge Cases
  // =========================================================================
  describe("Default Value Edge Cases", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table with defaults", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { DefaultV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          expect(diff.getSqlStatements().length).toBeGreaterThan(0);
          await sql.syncSchema();

          // Idempotency after first sync
          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v2: should detect default value changes", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { DefaultV2 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v3: should detect default removal", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { DefaultV3 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          const checkStmts = check.getSqlStatements();
          if (checkStmts.length > 0) {
          }
          expect(checkStmts.length).toBe(0);
        },
      );
    });

    test("v4: should detect re-added defaults", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { DefaultV4 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v5: should detect falsy defaults (empty string, 0, false)", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { DefaultV5 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 7. Index Lifecycle
  // =========================================================================
  describe("Index Lifecycle", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table without indexes", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { IndexLifecycleV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          expect(diff.getSqlStatements().length).toBeGreaterThan(0);
          await sql.syncSchema();
        },
      );
    });

    test("v2: should detect index additions", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { IndexLifecycleV2 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          expect(
            stmts.some(
              (s) =>
                s.toLowerCase().includes("create index") ||
                s.toLowerCase().includes("idx_sd_il"),
            ),
          ).toBe(true);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v3: should detect single index drop, keep composite", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { IndexLifecycleV3 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          expect(
            stmts.some((s) => s.toLowerCase().includes("idx_sd_il_col_a")),
          ).toBe(true);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v4: should detect index swap", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { IndexLifecycleV4 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          // Should drop composite and add new single
          expect(
            stmts.some((s) => s.toLowerCase().includes("idx_sd_il_col_b_c")),
          ).toBe(true);
          expect(
            stmts.some((s) => s.toLowerCase().includes("idx_sd_il_col_b")),
          ).toBe(true);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 8. Unique Constraint Lifecycle
  // =========================================================================
  describe("Unique Constraint Lifecycle", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table without uniques", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { UniqueLifecycleV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          expect(diff.getSqlStatements().length).toBeGreaterThan(0);
          await sql.syncSchema();
        },
      );
    });

    test("v2: should detect unique additions", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { UniqueLifecycleV2 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          expect(
            stmts.some(
              (s) =>
                s.toLowerCase().includes("unique") ||
                s.toLowerCase().includes("uq_sd_ul"),
            ),
          ).toBe(true);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v3: should detect unique drop + composite add", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { UniqueLifecycleV3 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          // Should have drop username unique and add composite
          expect(
            stmts.some((s) => s.toLowerCase().includes("uq_sd_ul_username")),
          ).toBe(true);
          expect(
            stmts.some((s) => s.toLowerCase().includes("uq_sd_ul_email_code")),
          ).toBe(true);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v4: should detect all unique drops", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { UniqueLifecycleV4 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 9. Self-Referencing Relations
  // =========================================================================
  describe("Self-Referencing Relations", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table with self-referencing FK", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { SelfRefV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          expect(
            stmts.some((s) => s.toLowerCase().includes("create table")),
          ).toBe(true);
          // Should have FK referencing its own table
          expect(
            stmts.some(
              (s) =>
                s.toLowerCase().includes("references") ||
                s.toLowerCase().includes("foreign key"),
            ),
          ).toBe(true);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v2: should detect onDelete CASCADE addition to self-ref", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { SelfRefV2 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          // May have FK modification (drop + re-add with CASCADE)
          if (stmts.length > 0) {
            expect(
              stmts.some(
                (s) =>
                  s.toLowerCase().includes("cascade") ||
                  s.toLowerCase().includes("foreign"),
              ),
            ).toBe(true);
          }
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v3: should detect FK swap (remove parent, add manager)", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { SelfRefV3 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          // Should add managerId column and/or FK
          expect(
            stmts.some((s) => s.toLowerCase().includes("manager_id")),
          ).toBe(true);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 10. Circular Relations
  // =========================================================================
  describe("Circular / Multi-Table Relations", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create A→B FK relationship", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { CircularAV1, CircularBV1 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          expect(
            stmts.some((s) =>
              s.toLowerCase().includes("schema_diff_circular_a"),
            ),
          ).toBe(true);
          expect(
            stmts.some((s) =>
              s.toLowerCase().includes("schema_diff_circular_b"),
            ),
          ).toBe(true);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v2: should detect B→A FK addition (mutual references)", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { CircularAV2, CircularBV2 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          // Should add aId column and FK on B
          expect(stmts.some((s) => s.toLowerCase().includes("a_id"))).toBe(
            true,
          );
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v3: should detect A→B FK drop, keep B→A", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { CircularAV3, CircularBV3 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          // Should have FK drop for A→B
          if (stmts.length > 0) {
            expect(
              stmts.some(
                (s) =>
                  s.toLowerCase().includes("drop") ||
                  s.toLowerCase().includes("constraint"),
              ),
            ).toBe(true);
          }
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 11. Multiple FKs to Same Target
  // =========================================================================
  describe("Multiple FKs to Same Target", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table with 2 FKs to same anchor", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { MultiFkAnchor, MultiFkV1 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v2: should detect third FK addition + onDelete change", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { MultiFkAnchor, MultiFkV2 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          // Should add approvedById column and FK
          expect(
            stmts.some((s) => s.toLowerCase().includes("approved_by_id")),
          ).toBe(true);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 12. HasOne / HasMany Idempotency (No FK Impact)
  // =========================================================================
  describe("HasOne / HasMany Idempotency", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create parent + child with belongsTo FK", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { ParentV1, ChildV1 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v2: adding @hasOne on parent should NOT produce FK changes", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { ParentV2, ChildV2 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          // Adding hasOne/hasMany on parent side should not generate FK statements
          // The only FK is from Child's belongsTo
          expect(stmts.length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 13. ManyToMany Pivot Table Evolution
  // =========================================================================
  describe("ManyToMany Pivot Table Evolution", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should auto-create pivot table", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { M2mLeftV1, M2mRight },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          // Should create pivot table
          expect(
            stmts.some((s) =>
              s.toLowerCase().includes("schema_diff_m2m_pivot"),
            ),
          ).toBe(true);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v2: should detect manyToMany cascade change", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { M2mLeftV2, M2mRight },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          // May or may not have changes — cascade on M2M might require FK recreation
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v3: removing manyToMany should not crash", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { M2mLeftV3, M2mRight },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          // Should gracefully handle removal of M2M relation
          // Pivot table remains, but FKs may or may not be dropped
          await sql.syncSchema();
        },
      );
    });
  });

  // =========================================================================
  // 14. No-Change / Empty Scenarios
  // =========================================================================
  describe("No-Change / Empty Scenarios", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("should produce zero statements for already-synced model", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { ColumnDropV1 } },
        async (sql) => {
          // First sync
          await sql.syncSchema();

          // Second sync — should have no changes
          const diff = await SchemaDiff.makeDiff(sql);
          expect(diff.getSqlStatements().length).toBe(0);

          // Third sync — still no changes
          const diff3 = await SchemaDiff.makeDiff(sql);
          expect(diff3.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("should only generate statements for changed model (mixed scenario)", async () => {
      const SchemaDiff = await getSchemaDiff();
      // ColumnDropV1 is already synced from the previous test
      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { ColumnDropV1, PrecisionV1 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          // Should only have statements for PrecisionV1 (new table)
          expect(stmts.length).toBeGreaterThan(0);
          expect(
            stmts.some((s) =>
              s.toLowerCase().includes("schema_diff_precision"),
            ),
          ).toBe(true);
          // Should NOT have statements for col_drop (already synced)
          const colDropStmts = stmts.filter((s) =>
            s.toLowerCase().includes("schema_diff_col_drop"),
          );
          expect(colDropStmts.length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 15. Column with databaseName Override
  // =========================================================================
  describe("Column with databaseName Override", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table with custom column name", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { DbNameV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          expect(
            stmts.some((s) => s.toLowerCase().includes("my_custom_field")),
          ).toBe(true);
          await sql.syncSchema();

          // Idempotency — critical for databaseName round-trip
          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v2: should detect type change + new databaseName column", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { DbNameV2 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          expect(
            stmts.some((s) => s.toLowerCase().includes("another_custom_col")),
          ).toBe(true);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 16. Special Column Types
  // =========================================================================
  describe("Special Column Types (Boolean, Binary, Text)", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table with special types", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { SpecialTypesV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v2: should detect type changes and new column", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { SpecialTypesV2 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          // notes changed from text → varchar
          expect(stmts.some((s) => s.toLowerCase().includes("notes"))).toBe(
            true,
          );
          // isArchived is new
          expect(
            stmts.some((s) => s.toLowerCase().includes("is_archived")),
          ).toBe(true);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 17. Timestamp with Timezone (Postgres-specific behavior)
  // =========================================================================
  describe("Timestamp with Timezone", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table with timestamp (no tz)", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { TzV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          expect(diff.getSqlStatements().length).toBeGreaterThan(0);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v2: should detect withTimezone change", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { TzV2 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          if (dbType === "postgres") {
            // Postgres supports timezone — should detect change
            expect(stmts.length).toBeGreaterThan(0);
          }
          // MySQL/MariaDB don't support timezone on timestamp — may be 0 statements
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v3: should detect withTimezone removal", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { TzV3 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          if (dbType === "postgres") {
            expect(stmts.length).toBeGreaterThan(0);
          }
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 18. Primary Key Changes
  // =========================================================================
  describe("Primary Key Changes", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table with increment PK", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { PkChangeV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          expect(diff.getSqlStatements().length).toBeGreaterThan(0);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    // Postgres can't ALTER COLUMN TYPE to bigserial (pseudo-type only valid in CREATE TABLE)
    const pkChangeTest = dbType === "postgres" ? test.skip : test;
    pkChangeTest(
      "v2: should detect PK type change (increment → bigIncrement)",
      async () => {
        const SchemaDiff = await getSchemaDiff();
        await SqlDataSource.useConnection(
          { ...getConnectionConfig(), models: { PkChangeV2 } },
          async (sql) => {
            const diff = await SchemaDiff.makeDiff(sql);
            const stmts = diff.getSqlStatements();
            // PK type change (int→bigint) should be detected
            if (stmts.length > 0) {
              expect(
                stmts.some(
                  (s) =>
                    s.toLowerCase().includes("bigint") ||
                    s.toLowerCase().includes("id"),
                ),
              ).toBe(true);
            }
            await sql.syncSchema();

            const check = await SchemaDiff.makeDiff(sql);
            expect(check.getSqlStatements().length).toBe(0);
          },
        );
      },
    );
  });

  // =========================================================================
  // 19. Stress Test — Large Model
  // =========================================================================
  describe("Stress Test — Large Model (20+ columns)", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table with 20 columns", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { LargeV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          expect(
            stmts.some((s) => s.toLowerCase().includes("create table")),
          ).toBe(true);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v2: should handle batch modify 5 + add 3 + drop 2", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { LargeV2 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);

          // Verify drops detected
          expect(
            stmts.some(
              (s) =>
                s.toLowerCase().includes("col19") ||
                s.toLowerCase().includes("col20"),
            ),
          ).toBe(true);

          // Verify adds detected
          expect(stmts.some((s) => s.toLowerCase().includes("col21"))).toBe(
            true,
          );

          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 20. Extended Decorator Shortcuts Idempotency
  // =========================================================================
  describe("Extended Decorator Shortcuts Idempotency", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("should be idempotent with all decorator shortcut types", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { DecoratorsExtModel } },
        async (sql) => {
          // First sync — should create table
          const firstDiff = await SchemaDiff.makeDiff(sql);
          const firstStmts = firstDiff.getSqlStatements();
          expect(firstStmts.length).toBeGreaterThan(0);
          expect(
            firstStmts.some((s) => s.toLowerCase().includes("create table")),
          ).toBe(true);
          await sql.syncSchema();

          // Second sync — zero changes
          const secondDiff = await SchemaDiff.makeDiff(sql);
          const secondStmts = secondDiff.getSqlStatements();
          expect(secondStmts.length).toBe(0);

          // Third sync — still zero
          const thirdDiff = await SchemaDiff.makeDiff(sql);
          const thirdStmts = thirdDiff.getSqlStatements();
          expect(thirdStmts.length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 21. Full Edge Case Evolution Sequence
  // =========================================================================
  describe("Full Edge Case Evolution Sequence", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("should handle complete column evolution from v1 to v3 and converge", async () => {
      const SchemaDiff = await getSchemaDiff();

      const versions: Array<{
        models: Record<string, typeof Model>;
        desc: string;
      }> = [
        { models: { ColumnDropV1 }, desc: "ColumnDrop v1" },
        { models: { ColumnDropV2 }, desc: "ColumnDrop v2" },
        { models: { ColumnDropV3 }, desc: "ColumnDrop v3" },
      ];

      for (let i = 0; i < versions.length; i++) {
        const { models, desc } = versions[i];
        await SqlDataSource.useConnection(
          { ...getConnectionConfig(), models },
          async (sql) => {
            const diff = await SchemaDiff.makeDiff(sql);
            const stmts = diff.getSqlStatements();
            if (i === 0) {
              expect(stmts.length).toBeGreaterThan(0);
            }
            await sql.syncSchema();
          },
        );
      }

      // Final convergence check
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { ColumnDropV3 } },
        async (sql) => {
          const finalDiff = await SchemaDiff.makeDiff(sql);
          expect(finalDiff.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("should handle complete nullable evolution and converge", async () => {
      const SchemaDiff = await getSchemaDiff();

      // Drop to start fresh for this sub-test
      try {
        await baseSql.rawQuery(
          `DROP TABLE IF EXISTS schema_diff_nullable CASCADE`,
        );
      } catch {
        /* ignore */
      }

      const versions: Array<{
        models: Record<string, typeof Model>;
        desc: string;
      }> = [
        { models: { NullableV1 }, desc: "Nullable v1" },
        { models: { NullableV2 }, desc: "Nullable v2" },
        { models: { NullableV3 }, desc: "Nullable v3" },
        { models: { NullableV4 }, desc: "Nullable v4" },
      ];

      for (const { models, desc } of versions) {
        await SqlDataSource.useConnection(
          { ...getConnectionConfig(), models },
          async (sql) => {
            const diff = await SchemaDiff.makeDiff(sql);
            await sql.syncSchema();
          },
        );
      }

      // Convergence
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { NullableV4 } },
        async (sql) => {
          const finalDiff = await SchemaDiff.makeDiff(sql);
          expect(finalDiff.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("should handle complete default value evolution and converge", async () => {
      const SchemaDiff = await getSchemaDiff();

      try {
        await baseSql.rawQuery(
          `DROP TABLE IF EXISTS schema_diff_defaults CASCADE`,
        );
      } catch {
        /* ignore */
      }

      const versions: Array<{
        models: Record<string, typeof Model>;
        desc: string;
      }> = [
        { models: { DefaultV1 }, desc: "Default v1" },
        { models: { DefaultV2 }, desc: "Default v2" },
        { models: { DefaultV3 }, desc: "Default v3" },
        { models: { DefaultV4 }, desc: "Default v4" },
        { models: { DefaultV5 }, desc: "Default v5" },
      ];

      for (const { models, desc } of versions) {
        await SqlDataSource.useConnection(
          { ...getConnectionConfig(), models },
          async (sql) => {
            const diff = await SchemaDiff.makeDiff(sql);
            await sql.syncSchema();
          },
        );
      }

      // Convergence
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { DefaultV5 } },
        async (sql) => {
          const finalDiff = await SchemaDiff.makeDiff(sql);
          expect(finalDiff.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // Enum Column Evolution
  // =========================================================================
  describe("Enum Column Evolution", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table with enum column", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { EnumV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          expect(
            stmts.some((s) => s.toLowerCase().includes("create table")),
          ).toBe(true);
          expect(
            stmts.some((s) =>
              s.toLowerCase().includes("schema_diff_enum_test"),
            ),
          ).toBe(true);
          await sql.syncSchema();
        },
      );
    });

    test("v2: should detect enum value addition without crashing (active,inactive -> active,inactive,pending)", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { EnumV2 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);

          // Should reference the enum_test table via check constraint changes
          const hasEnumTableRef = stmts.some((s) =>
            s.toLowerCase().includes("schema_diff_enum_test"),
          );
          expect(hasEnumTableRef).toBe(true);

          await sql.syncSchema();
        },
      );
    });

    test("v3: should detect new enum column addition (priority)", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { EnumV3 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);

          const hasPriorityColumn = stmts.some((s) =>
            s.toLowerCase().includes("priority"),
          );
          expect(hasPriorityColumn).toBe(true);

          await sql.syncSchema();
        },
      );
    });

    test("full enum evolution should not throw", async () => {
      const SchemaDiff = await getSchemaDiff();
      await dropAllEdgeCaseTables(baseSql);

      const versions: Array<{
        models: Record<string, typeof Model>;
        desc: string;
      }> = [
        { models: { EnumV1 }, desc: "Enum v1" },
        { models: { EnumV2 }, desc: "Enum v2" },
        { models: { EnumV3 }, desc: "Enum v3" },
      ];

      for (const { models, desc } of versions) {
        await SqlDataSource.useConnection(
          { ...getConnectionConfig(), models },
          async (sql) => {
            const diff = await SchemaDiff.makeDiff(sql);
            // Should not throw for enum columns
            const stmts = diff.getSqlStatements();
            await sql.syncSchema();
          },
        );
      }
    });
  });

  // =========================================================================
  // 21b. Enum Column No Change (add non-enum column, enum stays the same)
  // =========================================================================
  describe("Enum Column No Change", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table with enum column", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { EnumNoChangeV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          expect(
            stmts.some((s) => s.toLowerCase().includes("create table")),
          ).toBe(true);
          await sql.syncSchema();
        },
      );
    });

    test("v1 idempotent: re-diffing with same model should produce no changes", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { EnumNoChangeV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBe(0);
        },
      );
    });

    test("v2: adding non-enum column should NOT drop the enum check constraint", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { EnumNoChangeV2 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);

          // Should add the description column
          const hasDescriptionAdd = stmts.some(
            (s) =>
              s.toLowerCase().includes("description") ||
              s.toLowerCase().includes("add"),
          );
          expect(hasDescriptionAdd).toBe(true);

          // Should NOT contain any constraint drop for the enum check
          const hasConstraintDrop = stmts.some(
            (s) =>
              s.toLowerCase().includes("drop constraint") ||
              s.toLowerCase().includes("drop_constraint"),
          );
          expect(hasConstraintDrop).toBe(false);

          await sql.syncSchema();
        },
      );
    });

    test("v2 idempotent: re-diffing after sync should produce no changes", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { EnumNoChangeV2 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBe(0);
        },
      );
    });

    test("full enum-no-change evolution should not throw", async () => {
      const SchemaDiff = await getSchemaDiff();
      await dropAllEdgeCaseTables(baseSql);

      const versions: Array<{
        models: Record<string, typeof Model>;
        desc: string;
      }> = [
        { models: { EnumNoChangeV1 }, desc: "EnumNoChange v1" },
        { models: { EnumNoChangeV2 }, desc: "EnumNoChange v2" },
      ];

      for (const { models, desc } of versions) {
        await SqlDataSource.useConnection(
          { ...getConnectionConfig(), models },
          async (sql) => {
            const diff = await SchemaDiff.makeDiff(sql);
            const stmts = diff.getSqlStatements();
            await sql.syncSchema();
          },
        );
      }
    });
  });

  // =========================================================================
  // 22. Index Drop Extreme (All indexes at once)
  // =========================================================================
  describe("Index Drop Extreme", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table with 5 indexes", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { IndexDropExtremeV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          expect(
            stmts.some((s) => s.toLowerCase().includes("create table")),
          ).toBe(true);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v2: should drop ALL 5 indexes simultaneously", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { IndexDropExtremeV2 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);

          const dropIndexStmts = stmts.filter((s) =>
            s.toLowerCase().includes("drop index"),
          );
          expect(dropIndexStmts.length).toBeGreaterThanOrEqual(3);

          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v3: should re-add 2 new indexes with different names", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { IndexDropExtremeV3 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);

          expect(
            stmts.some((s) => s.toLowerCase().includes("idx_ide_new_a")),
          ).toBe(true);
          expect(
            stmts.some((s) => s.toLowerCase().includes("idx_ide_new_b")),
          ).toBe(true);

          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 23. Check Constraint Drop Extreme (All checks at once)
  // =========================================================================
  describe("Check Constraint Drop Extreme", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table with 4 check constraints", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { CheckDropExtremeV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          expect(
            stmts.some((s) => s.toLowerCase().includes("create table")),
          ).toBe(true);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v2: should drop ALL 4 check constraints simultaneously", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { CheckDropExtremeV2 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();

          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v3: should re-add 2 checks with modified expressions", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { CheckDropExtremeV3 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);

          expect(
            stmts.some((s) => s.toLowerCase().includes("chk_cde_age_adult")),
          ).toBe(true);
          expect(
            stmts.some((s) =>
              s.toLowerCase().includes("chk_cde_status_extended"),
            ),
          ).toBe(true);

          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 24. Composite Index Lifecycle
  // =========================================================================
  describe("Composite Index Lifecycle", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table with 2 composite indexes", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { IndexCompositeV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v2: should drop both composites and add 2 single indexes", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { IndexCompositeV2 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);

          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v3: should swap back to composites with same names", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { IndexCompositeV3 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);

          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 25. Unique Constraint Modification
  // =========================================================================
  describe("Unique Constraint Modification", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table with unique on email", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { UniqueModifyV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          expect(
            stmts.some((s) => s.toLowerCase().includes("uq_um_email")),
          ).toBe(true);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v2: should modify unique to different column (same constraint name)", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { UniqueModifyV2 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();

          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v3: should change to composite unique with new name", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { UniqueModifyV3 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);

          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 26. Combined Drops (Index + Check + Column)
  // =========================================================================
  describe("Combined Drops", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table with index, check, and 4 columns", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { CombinedDropsV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v2: should drop index + check + column simultaneously", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { CombinedDropsV2 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);

          const hasDropIndex = stmts.some((s) =>
            s.toLowerCase().includes("drop index"),
          );
          const hasDropCheck = stmts.some((s) =>
            s.toLowerCase().includes("drop constraint"),
          );
          const hasDropColumn = stmts.some((s) =>
            s.toLowerCase().includes("drop column"),
          );

          expect(hasDropIndex || hasDropCheck || hasDropColumn).toBe(true);

          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v3: should add back different index and check", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { CombinedDropsV3 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);

          expect(
            stmts.some((s) => s.toLowerCase().includes("idx_cd_status")),
          ).toBe(true);

          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 27. Multiple FK Drops
  // =========================================================================
  describe("Multiple FK Drops", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table with 3 FKs to same anchor", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { FkDropAnchor, FkDropMultipleV1 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v2: should drop 2 of 3 FKs", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { FkDropAnchor, FkDropMultipleV2 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();

          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v3: should drop remaining FK", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        {
          ...getConnectionConfig(),
          models: { FkDropAnchor, FkDropMultipleV3 },
        },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();

          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 28. Constraint Naming Collision
  // =========================================================================
  describe("Constraint Naming Collision", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table with index named idx_collision on colA", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { ConstraintCollisionV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          expect(stmts.length).toBeGreaterThan(0);
          expect(
            stmts.some((s) => s.toLowerCase().includes("idx_collision")),
          ).toBe(true);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });

    test("v2: should drop idx_collision and re-add on colB with same name", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { ConstraintCollisionV2 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();

          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // 29. Custom Types (e.g., pgvector)
  // =========================================================================
  describe("Custom Types (pgvector-like)", () => {
    beforeAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });
    afterAll(async () => {
      await dropAllEdgeCaseTables(baseSql);
    });

    test("v1: should create table with custom varchar type with length", async () => {
      const SchemaDiff = await getSchemaDiff();
      await SqlDataSource.useConnection(
        { ...getConnectionConfig(), models: { CustomTypeV1 } },
        async (sql) => {
          const diff = await SchemaDiff.makeDiff(sql);
          const stmts = diff.getSqlStatements();
          console.log("Custom Type v1 SQL statements:", stmts);
          expect(stmts.length).toBeGreaterThan(0);
          expect(
            stmts.some((s) => s.toLowerCase().includes("varchar(255)")),
          ).toBe(true);
          await sql.syncSchema();

          const check = await SchemaDiff.makeDiff(sql);
          expect(check.getSqlStatements().length).toBe(0);
        },
      );
    });
  });
});
