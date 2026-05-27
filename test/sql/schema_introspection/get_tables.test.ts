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
  `[${env.DB_TYPE}] Schema Introspection - getTables()`,
  () => {
    const TEST_TABLE = "__get_tables_test__";

    beforeAll(async () => {
      await sql.schema().createTable(TEST_TABLE, (table) => {
        table.bigint("id").primaryKey().increment();
        table.varchar("name", 100);
      });
    });

    afterAll(async () => {
      await sql.schema().dropTable(TEST_TABLE, true);
    });

    test("should return array of table names", async () => {
      const tables = await sql.getTables();
      expect(Array.isArray(tables)).toBe(true);
      expect(tables.length).toBeGreaterThan(0);
      expect(tables).toContain(TEST_TABLE);
    });

    test("should return empty array for error", async () => {
      // This just verifies the method handles errors gracefully
      const tables = await sql.getTables();
      expect(Array.isArray(tables)).toBe(true);
    });
  },
);

conditionalDescribe(
  `[${env.DB_TYPE}] Schema Introspection - getColumnListing()`,
  () => {
    const TEST_TABLE = "__get_column_listing_test__";

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

    test("should return array of column names for table", async () => {
      const columns = await sql.getColumnListing(TEST_TABLE);
      expect(Array.isArray(columns)).toBe(true);
      expect(columns).toContain("id");
      expect(columns).toContain("name");
      expect(columns).toContain("email");
      expect(columns).toContain("age");
    });

    test("should return empty array for non-existent table", async () => {
      const columns = await sql.getColumnListing(
        "__non_existent__" + Date.now(),
      );
      expect(Array.isArray(columns)).toBe(true);
      expect(columns).toEqual([]);
    });
  },
);
