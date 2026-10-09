/**
 * DB-free tests for the schema builder guards that need no connection.
 */

import Schema from "../../src/sql/migrations/schema/schema";

describe("Schema::addPrimaryKey", () => {
  it("refuses sqlite instead of dying on a missing interpreter", () => {
    expect(() => new Schema("sqlite").addPrimaryKey("users", ["id"])).toThrow(
      /SQLITE_NOT_SUPPORTED/,
    );
  });

  it("queues the statement on the dialects that support it", () => {
    const schema = new Schema("postgres");
    schema.addPrimaryKey("users", ["id"]);

    expect(schema.queryStatements).toEqual([
      'alter table "users" add primary key ("id")',
    ]);
  });
});
