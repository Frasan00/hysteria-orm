import { Migration } from "../../../src/sql/migrations/migration";

export default class extends Migration {
  async up() {
    this.schema.createTable("user_address_with_bigint", (table) => {
      table.bigint("id").primaryKey().increment();
      table.bigint("user_id").foreignKey("users_with_bigint.id").notNullable();
      table
        .bigint("address_id")
        .foreignKey("address_with_bigint.id")
        .notNullable();

      table.timestamp("created_at", { withTimezone: true });
      table.timestamp("updated_at", { withTimezone: true });
      table.timestamp("deleted_at").default(null).nullable();
    });

    this.schema.alterTable("user_address_with_bigint", (table) => {
      table.addColumn((col) => col.bigint("test_bigint").notNullable());

      table.alterColumn((col) =>
        col.bigint("test_bigint").foreignKey("users_with_bigint.id", {
          constraintName: "test_bigint_fk",
        }),
      );
      table.dropConstraint("test_bigint_fk");

      table.alterColumn((col) =>
        col.bigint("test_bigint").foreignKey("users_with_bigint.id"),
      );
      table.dropForeignKey("test_bigint", "id");
      table.dropColumn("test_bigint");
    });
  }

  async down() {
    this.schema.dropTable("user_address_with_bigint");
  }
}
