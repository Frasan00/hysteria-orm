import { Migration } from "../../../src/sql/migrations/migration";

export default class extends Migration {
  async up() {
    this.schema.createTable("posts_with_bigint", (table) => {
      table.bigSerial("id").primary();
      table.bigInteger("user_id").references("users_with_bigint", "id");

      table.varchar("title", 500);
      table.text("content");
      table.tinytext("short_description");

      table.timestamp("created_at", { autoCreate: true });
      table.timestamp("updated_at", { autoCreate: true, autoUpdate: true });
      table.timestamp("deleted_at").default(null).nullable();
    });
  }

  async down() {
    this.schema.dropTable("posts_with_bigint");
  }
}
