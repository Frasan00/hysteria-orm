import { Migration } from "../../../src/sql/migrations/migration";

export default class extends Migration {
  async up() {
    this.schema.createTable("user_address_with_bigint", (table) => {
      table.bigSerial("id");
      table.bigInteger("user_id").references("users_with_bigint", "id");
      table.bigInteger("address_id").references("address_with_bigint", "id");

      table.timestamp("created_at");
      table.timestamp("updated_at");
      table.timestamp("deleted_at").default("NULL").nullable();
    });
  }

  async down() {
    this.schema.dropTable("user_address_with_bigint");
  }
}
