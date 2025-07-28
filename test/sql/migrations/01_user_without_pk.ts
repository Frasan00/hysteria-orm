import { Migration } from "../../../../lib/index.js";

export default class extends Migration {
  async up() {
    this.schema.createTable("users_without_pk", (table) => {
      table.varchar("name");
      table.varchar("email").unique();
      table.varchar("password");
      table.integer("age");
      table.decimal("salary", 10, 2);
      table.char("gender", 1);
      table.binary("image").nullable();
      table.float("height");
      table.text("description");
      table.text("short_description");
      table.double("weight");
      table.date("birth_date");
      table.jsonb("json");
      table.boolean("is_active");
      table.enum("status", ["active", "inactive"]).default("active");
      table.timestamp("created_at", { withTimezone: true });
      table.timestamp("updated_at", { withTimezone: true });
      table.timestamp("deleted_at").default(null).nullable();
    });
  }

  async down() {
    this.schema.dropTable("users_without_pk");
  }
}
