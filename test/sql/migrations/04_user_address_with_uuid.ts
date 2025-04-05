import { Migration } from "../../../src/sql/migrations/migration";

export default class extends Migration {
  async up() {
    this.schema.createTable("user_address_with_uuid", (table) => {
      table.uuid("id").primary();
      table.uuid("user_id").references("users_with_uuid", "id");
      table.uuid("address_id").references("address_with_uuid", "id");

      table.timestamp("created_at", { autoCreate: true });
      table.timestamp("updated_at", { autoCreate: true, autoUpdate: true });
      table.timestamp("deleted_at").default("NULL").nullable();
    });
  }

  async down() {
    this.schema.dropTable("user_address_with_uuid");
  }
}
