import { Migration } from "../../../../lib/index.js";

export default class extends Migration {
  async up() {
    this.schema.createTable("user_address_with_uuid", (table) => {
      table.uuid("id").primary();
      table.uuid("user_id").references("users_with_uuid", "id");
      table.uuid("address_id").references("address_with_uuid", "id");

      table.timestamp("created_at");
      table.timestamp("updated_at");
      table.timestamp("deleted_at").default("NULL").nullable();
    });
  }

  async down() {
    this.schema.dropTable("user_address_with_uuid");
  }
}
