/**
 * DB-free tests for the extended HAVING helpers: null, in/not in, between,
 * exists/not exists and wrapped groups. SQL and bindings are asserted per
 * dialect.
 */

import { defineModel, col } from "../../../src/sql/models/define_model";
import { QueryBuilder } from "../../../src/sql/query_builder/query_builder";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import type { SqlDataSourceType } from "../../../src/sql/sql_data_source_types";

const Users = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.text(),
    email: col.text(),
    meta: col.json(),
  },
});

const stub = (dbType: SqlDataSourceType) =>
  ({ getDbType: () => dbType }) as unknown as SqlDataSource;

const builderFor = <D extends SqlDataSourceType>(dbType: D) =>
  new QueryBuilder<any, Record<string, any>, D>(Users, stub(dbType));

describe("havingNull() / havingNotNull()", () => {
  it("renders null predicates without bindings", () => {
    expect(
      builderFor("postgres").groupBy("id").havingNull("email").toSql().sql,
    ).toContain('having "email" is null');

    expect(
      builderFor("postgres").groupBy("id").havingNotNull("email").toSql().sql,
    ).toContain('having "email" is not null');
  });

  it("supports and/or variants", () => {
    const sql = builderFor("mysql")
      .groupBy("id")
      .havingNotNull("email")
      .orHavingNull("email")
      .toSql().sql;
    expect(sql).toContain("having `email` is not null or `email` is null");
  });
});

describe("havingIn() / havingNotIn()", () => {
  it("renders placeholders per dialect", () => {
    const pg = builderFor("postgres")
      .groupBy("id")
      .havingIn("id", [1, 2, 3])
      .toSql();
    expect(pg.sql).toContain('having "id" in ($1, $2, $3)');
    expect(pg.bindings).toEqual([1, 2, 3]);

    expect(
      builderFor("mysql").groupBy("id").havingIn("id", [1, 2]).toSql().sql,
    ).toContain("having `id` in (?, ?)");

    expect(
      builderFor("sqlite").groupBy("id").havingIn("id", [1, 2]).toSql().sql,
    ).toContain('having "id" in (?, ?)');

    const mssql = builderFor("mssql")
      .groupBy("id")
      .havingIn("id", [1, 2])
      .toSql();
    expect(mssql.sql).toContain("having [id] in (@1, @2)");
  });

  it("renders not-in and and/or variants", () => {
    expect(
      builderFor("postgres").groupBy("id").havingNotIn("id", [1]).toSql().sql,
    ).toContain('having "id" not in ($1)');

    const sql = builderFor("postgres")
      .groupBy("id")
      .havingIn("id", [1])
      .orHavingNotIn("id", [2])
      .toSql().sql;
    expect(sql).toContain('having "id" in ($1) or "id" not in ($2)');
  });

  it("accepts a subquery", () => {
    const { sql } = builderFor("postgres")
      .groupBy("id")
      .havingIn("id", (qb) => qb.select("id").where("name", "x"))
      .toSql();

    expect(sql).toContain('having "id" in (select');
  });
});

describe("havingBetween() / havingNotBetween()", () => {
  it("uses the and form for the range", () => {
    const pg = builderFor("postgres")
      .groupBy("id")
      .havingBetween("id", [1, 10])
      .toSql();
    expect(pg.sql).toContain('having "id" between $1 and $2');
    expect(pg.bindings).toEqual([1, 10]);

    expect(
      builderFor("mysql").groupBy("id").havingBetween("id", [1, 10]).toSql()
        .sql,
    ).toContain("having `id` between ? and ?");

    expect(
      builderFor("mssql").groupBy("id").havingBetween("id", [1, 10]).toSql()
        .sql,
    ).toContain("having [id] between @1 and @2");
  });

  it("renders not-between and or variant", () => {
    expect(
      builderFor("postgres")
        .groupBy("id")
        .havingNotBetween("id", [1, 10])
        .toSql().sql,
    ).toContain('having "id" not between $1 and $2');

    expect(
      builderFor("postgres")
        .groupBy("id")
        .havingNotBetween("id", [1, 10])
        .orHavingBetween("id", [20, 30])
        .toSql().sql,
    ).toContain('or "id" between');
  });
});

describe("havingExists() / havingNotExists()", () => {
  it("renders exists and not exists subqueries", () => {
    const exists = builderFor("postgres")
      .groupBy("id")
      .havingExists((qb) => qb.select("id").where("name", "x"))
      .toSql();
    expect(exists.sql).toContain("having exists (select");
    expect(exists.bindings).toEqual(["x"]);

    expect(
      builderFor("mysql")
        .groupBy("id")
        .havingNotExists((qb) => qb.select("id"))
        .toSql().sql,
    ).toContain("having not exists (select");
  });
});

describe("havingWrapped()", () => {
  it("wraps a group of having conditions", () => {
    const { sql } = builderFor("postgres")
      .groupBy("id")
      .havingWrapped((qb) => {
        qb.having("id", 1).orHaving("id", 2);
      })
      .toSql();

    expect(sql).toContain('having ("id" = $1 or "id" = $2)');
  });

  it("supports orHavingWrapped", () => {
    const { sql } = builderFor("postgres")
      .groupBy("id")
      .having("id", 3)
      .orHavingWrapped((qb) => {
        qb.having("id", 1).having("id", 2);
      })
      .toSql();

    expect(sql).toContain('or ("id" = $2 and "id" = $3)');
  });
});
