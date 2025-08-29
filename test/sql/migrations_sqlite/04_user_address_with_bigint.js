import { Migration } from "../../../lib/index.js";

export default class extends Migration {
  async up() {
    this.schema.createTable("user_address_with_bigint", (table) => {
      table.bigint("id").primaryKey().increment();
      table.bigint("user_id").foreignKey("users_with_bigint.id").notNullable();
      table
        .bigint("address_id")
        .foreignKey("address_with_bigint.id")
        .notNullable();

      table.timestamp("created_at");
      table.timestamp("updated_at");
      table.timestamp("deleted_at").default(null).nullable();
    });
  }

  async down() {
    this.schema.dropTable("user_address_with_bigint");
  }
}
