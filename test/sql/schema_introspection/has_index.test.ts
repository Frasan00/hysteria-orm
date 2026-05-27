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
  `[${env.DB_TYPE}] Schema Introspection - hasIndex()`,
  () => {
    const TEST_TABLE = "__has_index_test__";

    beforeAll(async () => {
      await sql.schema().createTable(TEST_TABLE, (table) => {
        table.bigint("id").primaryKey().increment();
        table.varchar("email", 255);
      });

      await sql.schema().createIndex(TEST_TABLE, ["email"], {
        constraintName: "idx_test_email",
      });
    });

    afterAll(async () => {
      await sql.schema().dropIndex("idx_test_email", TEST_TABLE);
      await sql.schema().dropTable(TEST_TABLE, true);
    });

    test("should return true for existing index", async () => {
      const hasIndex = await sql.hasIndex(TEST_TABLE, "idx_test_email");
      expect(hasIndex).toBe(true);
    });

    test("should return false for non-existent index", async () => {
      const hasIndex = await sql.hasIndex(TEST_TABLE, "__non_existent_index__");
      expect(hasIndex).toBe(false);
    });

    test("should return false for non-existent table", async () => {
      const hasIndex = await sql.hasIndex(
        "__non_existent__" + Date.now(),
        "any_index",
      );
      expect(hasIndex).toBe(false);
    });
  },
);
