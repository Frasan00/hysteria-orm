import { Migration } from "../../../src/sql/migrations/migration";

export default class extends Migration {
  async up() {
    this.schema.createTable("users_without_pk", (table) => {
      table.varchar("name");
      table.varchar("email").unique();
      table.varchar("password");
      table.integer("age");
      table.decimal("salary", 10, 2);
      table.char("gender", 1);
      table.float("height");
      table.text("description");
      table.text("short_description");
      table.double("weight");
      table.date("birth_date");
      table.jsonb("json");
      table.boolean("is_active");
      table.enum("status", ["active", "inactive"]).default("active");
      table.varchar("created_at");
      table.varchar("updated_at");
      table.varchar("deleted_at").nullable();
    });
  }

  async down() {
    this.schema.dropTable("users_without_pk");
  }
}
