import { Migration } from "../../../src/sql/migrations/migration";

export default class extends Migration {
  async up() {
    this.schema.createTable("posts_with_uuid", (table) => {
      table.uuid("id").primary();
      table.uuid("user_id").references("users_with_uuid", "id");

      table.varchar("title", 500);
      table.text("content");
      table.tinytext("short_description");

      table.timestamp("created_at");
      table.timestamp("updated_at");
      table.timestamp("deleted_at").default("NULL").nullable();
    });
  }

  async down() {
    this.schema.dropTable("posts_with_uuid");
  }

  async afterUp(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log("after up resolved");
  }

  async afterDown(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log("after down resolved");
  }
}
