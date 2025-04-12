import { Migration } from "../../../src/sql/migrations/migration";

export default class extends Migration {
  async up() {
    this.schema.createTable("address_with_uuid", (table) => {
      table.uuid("id").primary();

      table.varchar("street", 1000);
      table.varchar("city", 1000);
      table.varchar("state", 1000);
      table.varchar("zip", 1000);
      table.varchar("country", 1000);

      table.timestamp("created_at", { autoCreate: true });
      table.timestamp("updated_at", { autoCreate: true, autoUpdate: true });
      table.timestamp("deleted_at").default("NULL").nullable();
    });
  }

  async down() {
    this.schema.dropTable("address_with_uuid");
  }
}
