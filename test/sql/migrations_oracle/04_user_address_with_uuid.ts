import { Migration } from "../../../src/sql/migrations/migration";

export default class extends Migration {
  async up() {
    this.schema.createTable("user_address_with_uuid", (table) => {
      table.uuid("id").primaryKey();
      table.uuid("user_id").foreignKey("users_with_uuid.id").notNullable();
      table.uuid("address_id").foreignKey("address_with_uuid.id").notNullable();

      table.varchar("created_at");
      table.varchar("updated_at");
      table.varchar("deleted_at").nullable();
    });
  }

  async down() {
    this.schema.dropTable("user_address_with_uuid");
  }
}
