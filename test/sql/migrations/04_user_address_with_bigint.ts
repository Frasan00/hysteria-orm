import { Migration } from "../../../src/sql/migrations/migration";

export default class extends Migration {
  async up() {
    this.schema.createTable("user_address_with_bigint", (table) => {
      table.bigInteger("id").primary();
      table.bigInteger("user_id").references("users_with_bigint", "id");
      table.bigInteger("address_id").references("address_with_bigint", "id");

      table.timestamp("created_at", { autoCreate: true });
      table.timestamp("updated_at", { autoCreate: true, autoUpdate: true });
      table.timestamp("deleted_at").default("NULL").nullable();
    });
  }

  async down() {
    this.schema.dropTable("user_address_with_bigint");
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
