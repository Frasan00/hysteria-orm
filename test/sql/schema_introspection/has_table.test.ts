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
  `[${env.DB_TYPE}] Schema Introspection - hasTable()`,
  () => {
    const TEST_TABLE = "__has_table_test__";

    beforeAll(async () => {
      await sql.schema().createTable(TEST_TABLE, (table) => {
        table.bigint("id").primaryKey().increment();
        table.varchar("name", 100);
      });
    });

    afterAll(async () => {
      await sql.schema().dropTable(TEST_TABLE, true);
    });

    test("should return true for existing table", async () => {
      const hasTable = await sql.hasTable(TEST_TABLE);
      expect(hasTable).toBe(true);
    });

    test("should return false for non-existent table", async () => {
      const hasTable = await sql.hasTable(
        "__non_existent_table__" + Date.now(),
      );
      expect(hasTable).toBe(false);
    });
  },
);
