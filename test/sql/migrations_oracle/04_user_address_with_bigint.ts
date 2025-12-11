import { Migration } from "../../../src/sql/migrations/migration";

export default class extends Migration {
  async up() {
    this.schema.createTable("user_address_with_bigint", (table) => {
      table.bigint("id").primaryKey().increment();
      table.bigint("user_id").foreignKey("users_with_bigint.id").notNullable();
      table
        .bigint("address_id")
        .foreignKey("address_with_bigint.id")
        .notNullable();

      table.varchar("created_at");
      table.varchar("updated_at");
      table.varchar("deleted_at").nullable();
    });
  }

  async down() {
    this.schema.dropTable("user_address_with_bigint");
  }
}
