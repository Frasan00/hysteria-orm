import { Migration } from "../../../src/sql/migrations/migration";

export default class extends Migration {
  async up() {
    this.schema.createTable("address_with_bigint", (table) => {
      table.bigInteger("id").primary();

      table.varchar("street", 1000);
      table.varchar("city", 1000);
      table.varchar("state", 1000);
      table.varchar("zip", 1000);
      table.varchar("country", 1000);

      table.timestamp("created_at");
      table.timestamp("updated_at");
      table.timestamp("deleted_at").default("NULL").nullable();
    });
  }

  async down() {
    this.schema.dropTable("address_with_bigint");
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
