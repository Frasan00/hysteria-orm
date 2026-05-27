import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";

let sql: SqlDataSource;

beforeAll(async () => {
  sql = new SqlDataSource();
  await sql.connect();
});

const isSupported = ["postgres", "mysql", "mariadb"].includes(env.DB_TYPE!);
const conditionalDescribe = isSupported ? describe : describe.skip;

conditionalDescribe(
  `[${env.DB_TYPE}] SchemaBuilder - dropTableIfExists()`,
  () => {
    const TEST_TABLE = "__drop_if_exists_test__";

    afterEach(async () => {
      await sql.schema().dropTable(TEST_TABLE, true);
    });

    test("should drop existing table", async () => {
      await sql.schema().createTable(TEST_TABLE, (table) => {
        table.bigint("id").primaryKey().increment();
      });

      expect(await sql.hasTable(TEST_TABLE)).toBe(true);

      await sql.schema().dropTableIfExists(TEST_TABLE);

      expect(await sql.hasTable(TEST_TABLE)).toBe(false);
    });

    test("should not error when table doesn't exist", async () => {
      expect(await sql.hasTable(TEST_TABLE)).toBe(false);

      await expect(
        sql.schema().dropTableIfExists(TEST_TABLE),
      ).resolves.not.toThrow();

      expect(await sql.hasTable(TEST_TABLE)).toBe(false);
    });
  },
);

conditionalDescribe(
  `[${env.DB_TYPE}] SchemaBuilder - dropIndexIfExists()`,
  () => {
    const TEST_TABLE = "__drop_idx_if_exists__";

    beforeAll(async () => {
      await sql.schema().createTable(TEST_TABLE, (table) => {
        table.bigint("id").primaryKey().increment();
        table.varchar("email", 255);
      });
    });

    afterAll(async () => {
      await sql.schema().dropIndexIfExists("idx_test_email", TEST_TABLE);
      await sql.schema().dropTable(TEST_TABLE, true);
    });

    test("should drop existing index", async () => {
      await sql.schema().createIndex(TEST_TABLE, ["email"], {
        constraintName: "idx_test_email",
      });

      expect(await sql.hasIndex(TEST_TABLE, "idx_test_email")).toBe(true);

      await sql.schema().dropIndexIfExists("idx_test_email", TEST_TABLE);

      expect(await sql.hasIndex(TEST_TABLE, "idx_test_email")).toBe(false);
    });

    test("should not error when index doesn't exist", async () => {
      await expect(
        sql.schema().dropIndexIfExists("__non_existent_idx__", TEST_TABLE),
      ).resolves.not.toThrow();
    });
  },
);

conditionalDescribe(`[${env.DB_TYPE}] SchemaBuilder - renameColumn()`, () => {
  const TEST_TABLE = "__rename_col_test__";

  beforeAll(async () => {
    await sql.schema().createTable(TEST_TABLE, (table) => {
      table.bigint("id").primaryKey().increment();
      table.varchar("old_name", 100);
    });
  });

  afterAll(async () => {
    await sql.schema().dropTable(TEST_TABLE, true);
  });

  test("should rename column", async () => {
    expect(await sql.hasColumn(TEST_TABLE, "old_name")).toBe(true);
    expect(await sql.hasColumn(TEST_TABLE, "new_name")).toBe(false);

    await sql.schema().renameColumn(TEST_TABLE, "old_name", "new_name");

    expect(await sql.hasColumn(TEST_TABLE, "old_name")).toBe(false);
    expect(await sql.hasColumn(TEST_TABLE, "new_name")).toBe(true);
  });
});
