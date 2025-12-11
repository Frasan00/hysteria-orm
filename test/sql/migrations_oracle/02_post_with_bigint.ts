import { Migration } from "../../../src/sql/migrations/migration";

export default class extends Migration {
  async up() {
    this.schema.createTable("posts_with_bigint", (table) => {
      table.bigint("id").primaryKey().increment();
      table.bigint("user_id").foreignKey("users_with_bigint.id").nullable();

      table.varchar("title", 500);
      table.text("content");
      table.text("short_description");

      table.varchar("created_at");
      table.varchar("updated_at");
      table.varchar("deleted_at").nullable();
    });
  }

  async down() {
    this.schema.dropTable("posts_with_bigint");
  }
}
