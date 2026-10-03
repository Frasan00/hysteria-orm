/**
 * DB-free tests for the query-shape clauses: withSchema, withNotMaterialized,
 * using, fromRaw, intersect/except and crossJoin. Each assertion checks the
 * generated SQL (and bindings) per dialect, so it runs without a database.
 */

import { defineModel, col } from "../../../src/sql/models/define_model";
import { QueryBuilder } from "../../../src/sql/query_builder/query_builder";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import type { SqlDataSourceType } from "../../../src/sql/sql_data_source_types";

const Users = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.text(),
  },
});

const Settings = defineModel("settings", {
  columns: {
    id: col.increment(),
    key: col.text(),
  },
});

const stub = (dbType: SqlDataSourceType) =>
  ({ getDbType: () => dbType }) as unknown as SqlDataSource;

const builderFor = <D extends SqlDataSourceType>(dbType: D) =>
  new QueryBuilder<any, Record<string, any>, D>(Users, stub(dbType));

describe("withNotMaterialized()", () => {
  it("renders the NOT MATERIALIZED hint on postgres", () => {
    const sql = builderFor("postgres")
      .withNotMaterialized("active_users", (qb) => qb.select("id"))
      .select("*")
      .toQuery();

    expect(sql).toContain("with active_users as not materialized (");
  });

  it("renders NOT MATERIALIZED on cockroachdb too", () => {
    const sql = builderFor("cockroachdb")
      .withNotMaterialized("active_users", (qb) => qb.select("id"))
      .select("*")
      .toQuery();

    expect(sql).toContain("as not materialized (");
  });

  it("throws on dialects without NOT MATERIALIZED support", () => {
    const dialects: SqlDataSourceType[] = [
      "mysql",
      "mariadb",
      "sqlite",
      "mssql",
    ];
    for (const dbType of dialects) {
      expect(() =>
        builderFor(dbType).withNotMaterialized("x", (qb) => qb.select("id")),
      ).toThrow();
    }
  });
});

describe("withSchema()", () => {
  it("qualifies the table per dialect", () => {
    expect(
      builderFor("postgres").withSchema("public").select("id").toQuery(),
    ).toContain('from "public"."users"');
    expect(
      builderFor("mysql").withSchema("app").select("id").toQuery(),
    ).toContain("from `app`.`users`");
    expect(
      builderFor("sqlite").withSchema("main").select("id").toQuery(),
    ).toContain('from "main"."users"');
    expect(
      builderFor("mssql").withSchema("dbo").select("id").toQuery(),
    ).toContain("from [dbo].[users]");
  });

  it("qualifies joined tables but leaves column qualifiers bare", () => {
    const sql = builderFor("postgres")
      .withSchema("public")
      .join("orders", "orders.user_id", "users.id")
      .select("*")
      .toQuery();

    expect(sql).toContain('"public"."orders"');
    expect(sql).toContain('"orders"."user_id" = "users"."id"');
  });

  it("survives clone()", () => {
    const sql = builderFor("postgres")
      .withSchema("public")
      .clone()
      .select("id")
      .toQuery();

    expect(sql).toContain('from "public"."users"');
  });
});

describe("using()", () => {
  it("renders using (cols) instead of on", () => {
    const sql = builderFor("postgres")
      .join("orders")
      .using("user_id")
      .select("*")
      .toQuery();

    expect(sql).toContain('inner join "orders" using ("user_id")');
    expect(sql).not.toContain(" on ");
  });

  it("supports multiple columns and works after leftJoin", () => {
    const sql = builderFor("mysql")
      .leftJoin("orders")
      .using("user_id", "tenant_id")
      .select("*")
      .toQuery();

    expect(sql).toContain("left join `orders` using (`user_id`, `tenant_id`)");
  });

  it("throws when there is no preceding join", () => {
    expect(() => builderFor("postgres").using("user_id")).toThrow();
  });

  it("throws when no columns are provided", () => {
    expect(() => builderFor("postgres").join("orders").using()).toThrow();
  });

  it("throws on mssql when the query is compiled", () => {
    expect(() =>
      builderFor("mssql").join("orders").using("user_id").select("*").toQuery(),
    ).toThrow();
  });
});

describe("fromRaw()", () => {
  it("renders the raw fragment as the FROM source", () => {
    const sql = builderFor("postgres")
      .fromRaw("generate_series(1, 5) as n")
      .select("*")
      .toQuery();

    expect(sql).toContain("from generate_series(1, 5) as n");
  });

  it("rewrites ? placeholders and returns bindings per dialect", () => {
    const pg = builderFor("postgres")
      .fromRaw("(select ? as n) as t", [5])
      .select("*")
      .toSql();
    expect(pg.sql).toContain("(select $1 as n) as t");
    expect(pg.bindings).toEqual([5]);

    const mssql = builderFor("mssql")
      .fromRaw("(select ? as n) as t", [5])
      .select("*")
      .toSql();
    expect(mssql.sql).toContain("(select @1 as n) as t");
    expect(mssql.bindings).toEqual([5]);

    const mysql = builderFor("mysql")
      .fromRaw("(select ? as n) as t", [5])
      .select("*")
      .toSql();
    expect(mysql.sql).toContain("(select ? as n) as t");
    expect(mysql.bindings).toEqual([5]);
  });

  it("numbers raw placeholders ahead of later typed clauses", () => {
    const { sql, bindings } = builderFor("postgres")
      .fromRaw("generate_series(?, ?) as n", [1, 5])
      .select("*")
      .where("name", "abc")
      .toSql();

    expect(sql).toContain("generate_series($1, $2) as n");
    expect(bindings).toEqual([1, 5, "abc"]);
  });
});

describe("intersect() / except()", () => {
  it("renders intersect and except with a raw subquery", () => {
    const intersect = builderFor("postgres")
      .table("users")
      .select("id")
      .intersect("select id from admins")
      .toQuery();
    expect(intersect).toContain("intersect select id from admins");

    const except = builderFor("postgres")
      .table("users")
      .select("id")
      .except("select id from banned")
      .toQuery();
    expect(except).toContain("except select id from banned");
  });

  it("accepts a query-builder callback", () => {
    const sql = builderFor("postgres")
      .table("users")
      .select("id")
      .intersect((qb) => qb.select("id").where("active", true))
      .toQuery();

    expect(sql).toContain("intersect select");
    expect(sql).toContain("where");
  });

  it("chains multiple set operations in order", () => {
    const sql = builderFor("sqlite")
      .table("users")
      .select("id")
      .union("select id from a")
      .intersect("select id from b")
      .except("select id from c")
      .toQuery();

    const unionIdx = sql.indexOf("union");
    const intersectIdx = sql.indexOf("intersect");
    const exceptIdx = sql.indexOf("except");
    expect(unionIdx).toBeLessThan(intersectIdx);
    expect(intersectIdx).toBeLessThan(exceptIdx);
  });
});

describe("crossJoin()", () => {
  it("renders a cross join with no on clause", () => {
    const sql = builderFor("postgres")
      .crossJoin("settings")
      .select("*")
      .toQuery();

    expect(sql).toContain('cross join "settings"');
    expect(sql).not.toContain(" on ");
  });

  it("supports a table alias and a model", () => {
    expect(
      builderFor("mysql").crossJoin("settings", "s").select("*").toQuery(),
    ).toContain("cross join `settings` as `s`");
    expect(
      builderFor("postgres").crossJoin(Settings).select("*").toQuery(),
    ).toContain('cross join "settings"');
  });

  it("can be followed by a where clause", () => {
    const { sql } = builderFor("postgres")
      .crossJoin("settings")
      .select("*")
      .where("name", "x")
      .toSql();

    expect(sql).toContain('cross join "settings"');
    expect(sql).toContain('where "name" = $1');
  });
});
