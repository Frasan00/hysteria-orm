/**
 * Regression test: ON CONFLICT target + excluded.<col> must be bare column
 * names (Postgres/SQLite reject table-qualified refs like "sets"."id").
 *
 * `upsertMany`'s `conflictColumns: ModelKey<T>[]` accepts table-prefixed typed
 * refs (e.g. `SetModel.id` === "sets.id"); the interpreters must strip the table
 * prefix rather than feed it through formatStringColumn (which table-qualifies).
 */

import { AstParser } from "../../src/sql/ast/parser";
import { OnDuplicateNode } from "../../src/sql/ast/query/node/on_duplicate";
import { Model } from "../../src/sql/models/model";
import type { SqlDataSourceType } from "../../src/sql/sql_data_source_types";

describe("ON CONFLICT bare column refs", () => {
  const mockModel = {
    table: "sets",
    databaseCaseConvention: "preserve",
    modelCaseConvention: "preserve",
  } as typeof Model;

  const dialects: SqlDataSourceType[] = ["postgres", "cockroachdb", "sqlite"];

  dialects.forEach((dbType) => {
    describe(`${dbType}`, () => {
      it("strips table prefix from conflict target + update set (update mode)", () => {
        const parser = new AstParser(mockModel, dbType);
        const node = new OnDuplicateNode(
          "sets",
          ["sets.id"],
          ["sets.name"],
          "update",
        );

        const { sql } = parser.parse([node]);
        const lower = sql.toLowerCase();

        expect(lower).toContain('on conflict ("id") do update set');
        expect(lower).toContain('"name" = excluded."name"');
        // Table-qualified refs must never appear in the conflict target or update set.
        expect(sql).not.toContain('"sets"."id"');
        expect(sql).not.toContain('"sets"."name"');
      });

      it("strips table prefix from conflict target (ignore mode)", () => {
        const parser = new AstParser(mockModel, dbType);
        const node = new OnDuplicateNode("sets", ["sets.id"], [], "ignore");

        const { sql } = parser.parse([node]);
        const lower = sql.toLowerCase();

        expect(lower).toContain('on conflict ("id") do nothing');
        expect(sql).not.toContain('"sets"."id"');
      });

      it("keeps bare input unchanged (no regression)", () => {
        const parser = new AstParser(mockModel, dbType);
        const node = new OnDuplicateNode("sets", ["id"], ["name"], "update");

        const { sql } = parser.parse([node]);
        const lower = sql.toLowerCase();

        expect(lower).toContain('on conflict ("id") do update set');
        expect(lower).toContain('"name" = excluded."name"');
        expect(sql).not.toContain('"."');
      });
    });
  });
});
