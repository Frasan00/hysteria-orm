/**
 * DB-free tests for `ORDER BY ... NULLS FIRST/LAST`, including the ranking
 * emulation MySQL and MSSQL need, and the cursor guard. SQL and bindings are
 * asserted per dialect.
 */

import { defineModel, col } from "../../../src/sql/models/define_model";
import { QueryBuilder } from "../../../src/sql/query_builder/query_builder";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import type { SqlDataSourceType } from "../../../src/sql/sql_data_source_types";

const Users = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.text(),
    score: col.integer(),
  },
});

const stub = (dbType: SqlDataSourceType) =>
  ({ getDbType: () => dbType }) as unknown as SqlDataSource;

const builderFor = <D extends SqlDataSourceType>(dbType: D) =>
  new QueryBuilder<any, Record<string, any>, D>(Users, stub(dbType));

describe("orderBy() with nulls", () => {
  it("appends the native clause on postgres and sqlite", () => {
    for (const dbType of ["postgres", "cockroachdb", "sqlite"] as const) {
      const { sql } = builderFor(dbType)
        .select("*")
        .orderBy("score", { direction: "desc", nulls: "first" })
        .toSql();

      expect(sql).toContain("nulls first");
      expect(sql).toContain("order by");
    }
  });

  it("ranks nulls on mysql instead of emitting an unsupported clause", () => {
    for (const dbType of ["mysql", "mariadb"] as const) {
      const { sql } = builderFor(dbType)
        .select("*")
        .orderBy("score", { direction: "desc", nulls: "first" })
        .toSql();

      expect(sql).toContain("`score` is null desc, `score` desc");
      expect(sql).not.toContain("nulls");
    }
  });

  it("ranks nulls last on mysql", () => {
    const { sql } = builderFor("mysql")
      .select("*")
      .orderBy("score", { direction: "asc", nulls: "last" })
      .toSql();

    expect(sql).toContain("`score` is null asc, `score` asc");
  });

  it("ranks nulls on mssql with a case expression", () => {
    const { sql } = builderFor("mssql")
      .select("*")
      .orderBy("score", { direction: "desc", nulls: "first" })
      .toSql();

    expect(sql).toContain(
      "case when [score] is null then 1 else 0 end desc, [score] desc",
    );
    expect(sql).not.toContain("nulls");
  });

  it("ranks nulls last on mssql", () => {
    const { sql } = builderFor("mssql")
      .select("*")
      .orderBy("score", { direction: "asc", nulls: "last" })
      .toSql();

    expect(sql).toContain(
      "case when [score] is null then 1 else 0 end asc, [score] asc",
    );
  });

  it("leaves a plain string direction untouched", () => {
    for (const dbType of [
      "postgres",
      "mysql",
      "mariadb",
      "mssql",
      "sqlite",
    ] as const) {
      const { sql } = builderFor(dbType)
        .select("*")
        .orderBy("score", "asc")
        .toSql();

      expect(sql).not.toContain("nulls");
      expect(sql).not.toContain("is null");
      expect(sql).not.toContain("case when");
    }
  });

  it("carries the nulls clause through a limit on every dialect", () => {
    for (const dbType of [
      "postgres",
      "mysql",
      "mariadb",
      "mssql",
      "sqlite",
    ] as const) {
      const { sql } = builderFor(dbType)
        .select("*")
        .orderBy("score", { direction: "desc", nulls: "last" })
        .limit(10)
        .toSql();

      expect(sql).toMatch(/nulls last|is null asc|then 1 else 0 end asc/);
    }
  });

  it("refuses nulls ordering in paginateWithCursor", async () => {
    const builder = builderFor("postgres")
      .select("*")
      .orderBy("id", { direction: "asc", nulls: "first" });

    await expect(builder.paginateWithCursor(10)).rejects.toThrow(
      /ORDER_BY_NULLS_WITH_CURSOR_NOT_SUPPORTED|not supported/i,
    );
  });
});
