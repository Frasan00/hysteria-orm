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
  `[${env.DB_TYPE}] Schema Introspection - hasColumn()`,
  () => {
    const TEST_TABLE = "__has_column_test__";

    beforeAll(async () => {
      await sql.schema().createTable(TEST_TABLE, (table) => {
        table.bigint("id").primaryKey().increment();
        table.varchar("name", 100);
        table.integer("age");
        table.timestamp("created_at");
      });
    });

    afterAll(async () => {
      await sql.schema().dropTable(TEST_TABLE, true);
    });

    test("should return true for existing columns", async () => {
      expect(await sql.hasColumn(TEST_TABLE, "id")).toBe(true);
      expect(await sql.hasColumn(TEST_TABLE, "name")).toBe(true);
      expect(await sql.hasColumn(TEST_TABLE, "age")).toBe(true);
      expect(await sql.hasColumn(TEST_TABLE, "created_at")).toBe(true);
    });

    test("should return false for non-existent columns", async () => {
      const hasColumn = await sql.hasColumn(
        TEST_TABLE,
        "__non_existent_column__",
      );
      expect(hasColumn).toBe(false);
    });

    test("should return false for non-existent table", async () => {
      const hasColumn = await sql.hasColumn(
        "__non_existent_table__" + Date.now(),
        "id",
      );
      expect(hasColumn).toBe(false);
    });
  },
);

conditionalDescribe(
  `[${env.DB_TYPE}] Schema Introspection - hasColumns()`,
  () => {
    const TEST_TABLE = "__has_columns_test__";

    beforeAll(async () => {
      await sql.schema().createTable(TEST_TABLE, (table) => {
        table.bigint("id").primaryKey().increment();
        table.varchar("name", 100);
        table.varchar("email", 255);
        table.integer("age");
      });
    });

    afterAll(async () => {
      await sql.schema().dropTable(TEST_TABLE, true);
    });

    test("should return true when all columns exist", async () => {
      const hasColumns = await sql.hasColumns(
        TEST_TABLE,
        "id",
        "name",
        "email",
      );
      expect(hasColumns).toBe(true);
    });

    test("should return false when any column doesn't exist", async () => {
      const hasColumns = await sql.hasColumns(
        TEST_TABLE,
        "id",
        "name",
        "nonexistent",
      );
      expect(hasColumns).toBe(false);
    });

    test("should return false when table doesn't exist", async () => {
      const hasColumns = await sql.hasColumns(
        "__non_existent__" + Date.now(),
        "id",
      );
      expect(hasColumns).toBe(false);
    });

    test("should return true when no columns provided", async () => {
      const hasColumns = await sql.hasColumns(TEST_TABLE);
      expect(hasColumns).toBe(true);
    });
  },
);
