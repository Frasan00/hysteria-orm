import { Migration } from "../../../src/sql/migrations/migration";

export default class extends Migration {
  async up() {
    this.schema.createTable("address_with_bigint", (table) => {
      table.bigint("id").primaryKey().increment();

      table.varchar("street", 1000);
      table.varchar("city", 1000);
      table.varchar("state", 1000);
      table.varchar("zip", 1000);
      table.varchar("country", 1000);

      table.varchar("created_at");
      table.varchar("updated_at");
      table.varchar("deleted_at").nullable();
    });
  }

  async down() {
    this.schema.dropTable("address_with_bigint");
  }
}
