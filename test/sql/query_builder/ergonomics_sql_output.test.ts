/**
 * DB-free tests for the builder ergonomics: `modify` scopes, `{ skipBinding }`
 * pagination (including the two MSSQL parameter-index paths), set-operation
 * wrapping and PostgreSQL's `FROM ONLY`. SQL and bindings are asserted per dialect.
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

describe("modify()", () => {
  it("applies the scope and forwards its extra arguments", () => {
    const paginate = (qb: any, size: number, offset: number) =>
      qb.limit(size).offset(offset);

    const { sql, bindings } = builderFor("postgres")
      .select("*")
      .where("score", ">", 0)
      .modify(paginate, 5, 10)
      .toSql();

    expect(sql).toMatch(/"score" > \$1/);
    expect(sql).toContain("limit $2");
    expect(sql).toContain("offset $3");
    expect(bindings).toEqual([0, 5, 10]);
  });

  it("returns the same builder so it can be chained", () => {
    const qb = builderFor("postgres").select("*");
    expect(qb.modify((q) => q.where("id", "=", 1))).toBe(qb);
    expect(qb.toSql().sql).toContain('"id" = $1');
  });
});

describe("limit() and offset() with skipBinding", () => {
  it("inlines the values and keeps the placeholders of the rest of the query", () => {
    const expected = {
      postgres: 'where "score" > $1 limit 10 offset 2',
      mysql: "where `score` > ? limit 10 offset 2",
      sqlite: 'where "score" > ? limit 10 offset 2',
    } as const;

    for (const [dbType, fragment] of Object.entries(expected)) {
      const { sql, bindings } = builderFor(dbType as SqlDataSourceType)
        .select("*")
        .where("score", ">", 5)
        .limit(10, { skipBinding: true })
        .offset(2, { skipBinding: true })
        .toSql();

      expect(sql).toContain(fragment);
      expect(bindings).toEqual([5]);
    }
  });

  it("still binds by default", () => {
    const { sql, bindings } = builderFor("postgres")
      .select("*")
      .limit(10)
      .offset(2)
      .toSql();

    expect(sql).toContain("limit $1");
    expect(sql).toContain("offset $2");
    expect(bindings).toEqual([10, 2]);
  });

  it("inlines the mssql top clause and does not shift the later bindings", () => {
    const { sql, bindings } = builderFor("mssql")
      .select("*")
      .where("score", ">", 5)
      .limit(10, { skipBinding: true })
      .toSql();

    expect(sql).toContain("select top 10 *");
    expect(sql).toContain("where [score] > @1");
    expect(bindings).toEqual([5]);
  });

  it("still binds the mssql top clause by default", () => {
    const { sql, bindings } = builderFor("mssql")
      .select("*")
      .where("score", ">", 5)
      .limit(10)
      .toSql();

    expect(sql).toContain("select top (@1) *");
    expect(sql).toContain("where [score] > @2");
    expect(bindings).toEqual([10, 5]);
  });

  it("inlines both halves of the mssql offset/fetch path", () => {
    const { sql, bindings } = builderFor("mssql")
      .select("*")
      .where("score", ">", 5)
      .orderBy("id", "asc")
      .limit(10, { skipBinding: true })
      .offset(2, { skipBinding: true })
      .toSql();

    expect(sql).toContain("where [score] > @1");
    expect(sql).toContain("order by [id] asc");
    expect(sql).toContain("offset 2 rows fetch next 10 rows only");
    expect(bindings).toEqual([5]);
  });

  it("mixes one inlined half with one bound half on mssql", () => {
    const { sql, bindings } = builderFor("mssql")
      .select("*")
      .orderBy("id", "asc")
      .limit(10)
      .offset(2, { skipBinding: true })
      .toSql();

    expect(sql).toContain("offset 2 rows fetch next @1 rows only");
    expect(bindings).toEqual([10]);
  });
});

describe("set-operation wrapping", () => {
  it("wraps a union branch only when asked", () => {
    const wrapped = builderFor("postgres")
      .select("*")
      .union((qb: any) => qb.table("banned").select("id").limit(5), {
        wrap: true,
      })
      .toSql();

    expect(wrapped.sql).toContain("union (select");
    expect(wrapped.sql).toContain("limit $1)");

    const plain = builderFor("postgres")
      .select("*")
      .union((qb: any) => qb.table("banned").select("id"))
      .toSql();

    expect(plain.sql).toContain("union select");
    expect(plain.sql).not.toContain("union (select");
  });

  it("wraps unionAll, intersect and except the same way", () => {
    const expected = {
      unionAll: "union all (",
      intersect: "intersect (",
      except: "except (",
    } as const;

    for (const [method, fragment] of Object.entries(expected)) {
      const builder = builderFor("mysql").select("*") as unknown as Record<
        string,
        (cb: unknown, opts: unknown) => { toSql: () => { sql: string } }
      >;

      const { sql } = builder[method](
        (qb: any) => qb.table("banned").select("id"),
        { wrap: true },
      ).toSql();

      expect(sql).toContain(fragment);
    }
  });

  it("wraps a raw branch passed with explicit bindings", () => {
    const { sql } = builderFor("postgres")
      .select("*")
      .union("select 1 where 1 = ?", [1], { wrap: true })
      .toSql();

    expect(sql).toContain("union (select 1 where 1 = $1)");
  });
});

describe("fromOnly()", () => {
  it("renders from only on postgres", () => {
    const { sql } = builderFor("postgres").select("*").fromOnly().toSql();
    expect(sql).toContain('from only "users"');
  });

  it("can be turned back off", () => {
    const { sql } = builderFor("postgres")
      .select("*")
      .fromOnly()
      .fromOnly(false)
      .toSql();

    expect(sql).not.toContain("only");
  });

  it("rejects every other dialect", () => {
    for (const dbType of ["mysql", "mariadb", "sqlite", "mssql"] as const) {
      expect(() => builderFor(dbType).select("*").fromOnly()).toThrow(
        /ONLY_NOT_SUPPORTED/,
      );
    }
  });
});
