/**
 * DB-free regression test for the jsonb parameter cast.
 *
 * `jsonColumn.prepare` returns `JSON.stringify(value)` for non-strings and passes
 * strings through untouched. The write interpreters used to key the cast off the JS
 * value alone, so a prepared string got no cast: node-pg coerces the text parameter
 * into jsonb, but Bun.sql binds a JS string as a JSON *string*, storing the
 * double-encoded scalar `"{\"sandbox\":true}"` instead of the object. Reads still
 * worked (`serialize` re-parses), so the defect was silent, but `->>` returned NULL.
 *
 * The fix casts string payloads on jsonb columns `::text::jsonb`. `::text` first is
 * required: a bare `::jsonb` on an already-string value is a no-op, because the
 * server sees a JSON string and casts it to a JSON string.
 */

import { col, defineModel } from "../../../src/sql/models/define_model";
import { QueryBuilder } from "../../../src/sql/query_builder/query_builder";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import type { SqlDataSourceType } from "../../../src/sql/sql_data_source_types";

const Payload = defineModel("payloads", {
  columns: {
    id: col.increment(),
    setup: col.jsonb(),
    config: col.json(),
    note: col.text(),
  },
});

const builderFor = (dbType: SqlDataSourceType) =>
  new QueryBuilder(Payload, {
    getDbType: () => dbType,
  } as unknown as SqlDataSource);

describe("jsonb string cast on write", () => {
  it("insert: a prepared string into jsonb is cast ::text::jsonb", () => {
    const sql = builderFor("postgres")
      .insert({ setup: '{"sandbox":true}' })
      .toQuery();

    expect(sql).toContain("::text::jsonb");
  });

  it("insert: a prepared string into json is cast ::text::jsonb", () => {
    const sql = builderFor("postgres").insert({ config: '{"a":1}' }).toQuery();

    expect(sql).toContain("::text::jsonb");
  });

  it("insert: an object into jsonb keeps the bare ::jsonb cast", () => {
    const sql = builderFor("postgres")
      .insert({ setup: { sandbox: true } })
      .toQuery();

    expect(sql).toContain("::jsonb");
    expect(sql).not.toContain("::text::jsonb");
  });

  it("insert: a string into a text column is not cast", () => {
    const sql = builderFor("postgres").insert({ note: "hello" }).toQuery();

    expect(sql).not.toContain("::jsonb");
    expect(sql).not.toContain("::text");
  });

  it("update: a prepared string into jsonb is cast ::text::jsonb", () => {
    const sql = builderFor("postgres")
      .where("id", "=", 1)
      .update({ setup: '{"sandbox":true}' })
      .toQuery();

    expect(sql).toContain("::text::jsonb");
  });

  it("update: a string into a text column is not cast", () => {
    const sql = builderFor("postgres")
      .where("id", "=", 1)
      .update({ note: "hello" })
      .toQuery();

    expect(sql).not.toContain("::jsonb");
  });

  it("cockroachdb shares the postgres cast", () => {
    const sql = builderFor("cockroachdb")
      .insert({ setup: '{"sandbox":true}' })
      .toQuery();

    expect(sql).toContain("::text::jsonb");
  });

  it("mysql does not gain a postgres cast", () => {
    const sql = builderFor("mysql")
      .insert({ setup: '{"sandbox":true}' })
      .toQuery();

    expect(sql).not.toContain("::jsonb");
  });
});
