/**
 * DB-free regression test for the placement of the update/delete returning clause.
 *
 * The clause used to be emitted by the update/delete interpreter itself, i.e. right
 * after the `set` prefix and *before* the where nodes, which is invalid on PostgreSQL
 * (RETURNING must be last) and nonexistent on MySQL/MariaDB. It is now a ReturningNode
 * the builder inserts at the dialect-correct position.
 */

import { QueryBuilder } from "../../../src/sql/query_builder/query_builder";
import { Model } from "../../../src/sql/models/model";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import type { SqlDataSourceType } from "../../../src/sql/sql_data_source_types";

const mockModel = {
  table: "users",
  databaseCaseConvention: "preserve",
  modelCaseConvention: "preserve",
} as typeof Model;

const builderFor = (dbType: SqlDataSourceType) =>
  new QueryBuilder(mockModel, {
    getDbType: () => dbType,
  } as unknown as SqlDataSource);

describe("update/delete returning clause placement", () => {
  it("postgres: RETURNING comes after the where clause", () => {
    const sql = builderFor("postgres")
      .where("id", "=", 1)
      .update({ name: "Jane" }, ["name"])
      .toQuery();

    expect(sql.toLowerCase()).toContain('update "users" set');
    expect(sql.toLowerCase()).toMatch(/where[\s\S]*returning "name"$/);
  });

  it("cockroachdb: RETURNING comes after the where clause", () => {
    const sql = builderFor("cockroachdb")
      .where("id", "=", 1)
      .update({ name: "Jane" }, ["name"])
      .toQuery();

    expect(sql.toLowerCase()).toMatch(/where[\s\S]*returning "name"$/);
  });

  it("sqlite: RETURNING comes after the where clause", () => {
    const sql = builderFor("sqlite")
      .where("id", "=", 1)
      .update({ name: "Jane" }, ["*"])
      .toQuery();

    expect(sql.toLowerCase()).toMatch(/where[\s\S]*returning \*$/);
  });

  it("mssql: OUTPUT sits between set and where", () => {
    const sql = builderFor("mssql")
      .where("id", "=", 1)
      .update({ name: "Jane" }, ["name"])
      .toQuery();
    const lower = sql.toLowerCase();

    expect(lower).toContain("output inserted.[name]");
    expect(lower.indexOf("output")).toBeGreaterThan(lower.indexOf(" set "));
    expect(lower.indexOf("output")).toBeLessThan(lower.indexOf(" where "));
  });

  it("mssql delete: OUTPUT reads from the deleted pseudo-table", () => {
    const sql = builderFor("mssql")
      .where("id", "=", 1)
      .delete(["id"])
      .toQuery();

    expect(sql.toLowerCase()).toContain("output deleted.[id]");
  });

  it("postgres delete: RETURNING is last", () => {
    const sql = builderFor("postgres")
      .where("id", "=", 1)
      .delete(["id"])
      .toQuery();

    expect(sql.toLowerCase()).toContain('delete from "users"');
    expect(sql.toLowerCase()).toMatch(/returning "id"$/);
  });

  it("mysql and mariadb emit no returning clause", () => {
    for (const dbType of ["mysql", "mariadb"] as SqlDataSourceType[]) {
      const updateSql = builderFor(dbType)
        .where("id", "=", 1)
        .update({ name: "Jane" }, ["name"])
        .toQuery();
      const deleteSql = builderFor(dbType)
        .where("id", "=", 1)
        .delete(["id"])
        .toQuery();

      expect(updateSql.toLowerCase()).not.toContain("returning");
      expect(deleteSql.toLowerCase()).not.toContain("returning");
    }
  });

  it("without returning the builder still emits a plain write", () => {
    const sql = builderFor("postgres").update({ name: "Jane" }).toQuery();

    expect(sql).not.toContain("returning");
  });
});
