import { Migration } from "../../../src/sql/migrations/migration";

export default class extends Migration {
  async up() {
    this.schema.createTable("posts_with_uuid", (table) => {
      table.uuid("id").primaryKey();
      table.uuid("user_id").foreignKey("users_with_uuid.id").nullable();

      table.varchar("title", 500);
      table.text("content");
      table.text("short_description");

      table.timestamp("created_at", { withTimezone: true });
      table.timestamp("updated_at", { withTimezone: true });
      table.timestamp("deleted_at").default(null).nullable();
    });
  }

  async down() {
    this.schema.dropTable("posts_with_uuid");
  }
}
