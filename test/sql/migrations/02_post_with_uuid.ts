import { Migration } from "../../../src/sql/migrations/migration";
import crypto from "node:crypto";

export default class extends Migration {
  async up() {
    this.schema.createTable("posts_with_uuid", (table) => {
      table.uuid("id").primary();
      table.uuid("user_id").references("users_with_uuid", "id");

      table.varchar("title", 500);
      table.text("content");
      table.tinytext("short_description");

      table.timestamp("created_at", { autoCreate: true });
      table.timestamp("updated_at", { autoCreate: true, autoUpdate: true });
      table.timestamp("deleted_at").default("NULL").nullable();
    });

    const id = crypto.randomUUID();
    this.schema.useQueryBuilder("posts_with_uuid", (queryBuilder) => {
      return queryBuilder.insert({
        id: id,
        title: "Hello World",
        content: "This is a test post",
        shortDescription: "This is a test post",
      });
    });

    this.schema.useQueryBuilder("posts_with_uuid", (queryBuilder) => {
      return queryBuilder.where("id", id).update({
        title: "Hello World Updated",
      });
    });

    this.schema.useQueryBuilder("posts_with_uuid", (queryBuilder) => {
      return queryBuilder.where("id", id).delete();
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
