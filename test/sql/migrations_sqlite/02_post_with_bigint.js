import { Migration } from "../../../lib/index.js";

export default class extends Migration {
  async up() {
    this.schema.createTable("posts_with_bigint", (table) => {
      table.bigIncrement("id");
      table.bigint("user_id").foreignKey("users_with_bigint.id").nullable();

      table.varchar("title", 500);
      table.text("content");
      table.text("short_description");

      table.timestamp("created_at");
      table.timestamp("updated_at");
      table.timestamp("deleted_at").default(null).nullable();
    });
  }

  async down() {
    this.schema.dropTable("posts_with_bigint");
  }
}
