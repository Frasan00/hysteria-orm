import { Migration } from "../../../src/sql/migrations/migration";

export default class extends Migration {
  async up() {
    this.schema.createTable("address_with_bigint", (table) => {
      table.bigSerial("id").primary();

      table.varchar("street", 1000);
      table.varchar("city", 1000);
      table.varchar("state", 1000);
      table.varchar("zip", 1000);
      table.varchar("country", 1000);

      table.timestamp("created_at");
      table.timestamp("updated_at");
      table.timestamp("deleted_at").default(null).nullable();
    });
  }

  async down() {
    this.schema.dropTable("address_with_bigint");
  }
}
