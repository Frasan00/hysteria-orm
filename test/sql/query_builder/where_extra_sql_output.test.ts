/**
 * DB-free tests for the extended WHERE helpers: negated column comparison,
 * JSON object equality, JSON path comparison, JSON superset/subset, JSON
 * has-none and columnInfo. SQL and bindings are asserted per dialect.
 */

import { RawNode } from "../../../src/sql/ast/query/node/raw/raw_node";
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

describe("whereNotColumn()", () => {
  it("renders != for the two-argument form", () => {
    const { sql } = builderFor("postgres")
      .whereNotColumn("users.name", "users.email")
      .toSql();

    expect(sql).toContain('where "users"."name" != "users"."email"');
  });

  it("negates an explicit comparison operator", () => {
    const { sql } = builderFor("postgres")
      .whereNotColumn("users.id", ">", "users.id")
      .toSql();

    expect(sql).toContain('not ("users"."id" > "users"."id")');
  });

  it("supports and/or variants and mysql quoting", () => {
    const andSql = builderFor("mysql")
      .where("id", 1)
      .andWhereNotColumn("users.name", "users.email")
      .toSql().sql;
    expect(andSql).toContain("and `users`.`name` != `users`.`email`");

    const orSql = builderFor("postgres")
      .where("id", 1)
      .orWhereNotColumn("users.name", "users.email")
      .toSql().sql;
    expect(orSql).toContain('or "users"."name" != "users"."email"');
  });
});

describe("whereJsonObject() / whereNotJsonObject()", () => {
  it("renders exact JSON equality per dialect", () => {
    const pg = builderFor("postgres").whereJsonObject("meta", { a: 1 }).toSql();
    expect(pg.sql).toContain('"meta" = $1::jsonb');
    expect(pg.bindings).toEqual([JSON.stringify({ a: 1 })]);

    expect(
      builderFor("mysql").whereJsonObject("meta", { a: 1 }).toSql().sql,
    ).toContain("`meta` = CAST(? AS JSON)");

    expect(
      builderFor("sqlite").whereJsonObject("meta", { a: 1 }).toSql().sql,
    ).toContain('json("meta") = json(?)');

    expect(
      builderFor("mssql").whereJsonObject("meta", { a: 1 }).toSql().sql,
    ).toContain("[meta] = @1");
  });

  it("negates with whereNotJsonObject and supports or", () => {
    expect(
      builderFor("postgres").whereNotJsonObject("meta", { a: 1 }).toSql().sql,
    ).toContain('not ("meta" = $1::jsonb)');

    const orSql = builderFor("postgres")
      .where("id", 1)
      .orWhereJsonObject("meta", { a: 1 })
      .toSql().sql;
    expect(orSql).toContain('or "meta" =');
  });
});

describe("whereJsonPath()", () => {
  it("renders path extraction per dialect", () => {
    const pg = builderFor("postgres")
      .whereJsonPath("meta", "address.city", "=", "Rome")
      .toSql();
    expect(pg.sql).toContain(`"meta"->'address'->>'city' = $1`);
    expect(pg.bindings).toEqual(["Rome"]);

    expect(
      builderFor("mysql")
        .whereJsonPath("meta", "address.city", "=", "Rome")
        .toSql().sql,
    ).toContain("JSON_UNQUOTE(JSON_EXTRACT(`meta`, '$.address.city')) = ?");

    expect(
      builderFor("sqlite")
        .whereJsonPath("meta", "address.city", "=", "Rome")
        .toSql().sql,
    ).toContain("json_extract(\"meta\", '$.address.city') = ?");

    expect(
      builderFor("mssql")
        .whereJsonPath("meta", "address.city", "=", "Rome")
        .toSql().sql,
    ).toContain("JSON_VALUE([meta], '$.address.city') = @1");
  });

  it("accepts a path array, a $-prefixed path and a numeric operator", () => {
    expect(
      builderFor("postgres")
        .whereJsonPath("meta", ["stats", "views"], ">", 10)
        .toSql().sql,
    ).toContain(`"meta"->'stats'->>'views' > $1`);

    expect(
      builderFor("postgres")
        .whereJsonPath("meta", "$.stats.views", ">", 10)
        .toSql().sql,
    ).toContain(`"meta"->'stats'->>'views' > $1`);
  });
});

describe("whereJsonSupersetOf() / whereJsonSubsetOf()", () => {
  it("renders superset and its negation", () => {
    expect(
      builderFor("postgres").whereJsonSupersetOf("meta", { a: 1 }).toSql().sql,
    ).toContain('"meta" @> $1::jsonb');

    expect(
      builderFor("postgres").whereJsonNotSupersetOf("meta", { a: 1 }).toSql()
        .sql,
    ).toContain('not ("meta" @> $1::jsonb)');

    expect(
      builderFor("mysql").whereJsonSupersetOf("meta", { a: 1 }).toSql().sql,
    ).toContain("JSON_CONTAINS(`meta`, ?)");
  });

  it("renders subset per dialect", () => {
    expect(
      builderFor("postgres").whereJsonSubsetOf("meta", { a: 1 }).toSql().sql,
    ).toContain('"meta" <@ $1::jsonb');

    expect(
      builderFor("mysql").whereJsonSubsetOf("meta", { a: 1 }).toSql().sql,
    ).toContain("JSON_CONTAINS(?, `meta`)");
  });

  it("throws on dialects without subset support", () => {
    expect(() =>
      builderFor("sqlite").whereJsonSubsetOf("meta", { a: 1 }).toSql(),
    ).toThrow();
    expect(() =>
      builderFor("mssql").whereJsonNotSubsetOf("meta", { a: 1 }).toSql(),
    ).toThrow();
  });
});

describe("whereJsonHasNone()", () => {
  it("renders a postgres key-presence filter", () => {
    const { sql, bindings } = builderFor("postgres")
      .whereJsonHasNone("meta", ["a", "b"])
      .toSql();

    expect(sql).toContain('not (jsonb_exists_any("meta", array[$1, $2]))');
    expect(bindings).toEqual(["a", "b"]);
  });

  it("throws on unsupported dialects", () => {
    for (const dbType of ["mysql", "sqlite", "mssql"] as SqlDataSourceType[]) {
      expect(() =>
        builderFor(dbType).whereJsonHasNone("meta", ["a"]).toSql(),
      ).toThrow();
    }
  });
});

describe("whereILike() emulation", () => {
  it("keeps the native operator on postgres and cockroachdb", () => {
    expect(
      builderFor("postgres").whereILike("name", "%jo%").toSql().sql,
    ).toContain('"name" ilike $1');
    expect(
      builderFor("cockroachdb").whereILike("name", "%jo%").toSql().sql,
    ).toContain('"name" ilike $1');
  });

  it("lowers both sides where the dialect has no ilike", () => {
    const expected: Record<string, string> = {
      mysql: "lower(`name`) like lower(?)",
      mariadb: "lower(`name`) like lower(?)",
      mssql: "lower([name]) like lower(@1)",
      sqlite: 'lower("name") like lower(?)',
    };

    for (const [dbType, expectedSql] of Object.entries(expected)) {
      const { sql, bindings } = builderFor(dbType as SqlDataSourceType)
        .whereILike("name", "%jo%")
        .toSql();

      expect(sql).toContain(expectedSql);
      expect(bindings).toEqual(["%jo%"]);
    }
  });

  it("negates with `not like`, not with `not (x like y)`", () => {
    const expected: Record<string, string> = {
      mysql: "lower(`name`) not like lower(?)",
      mariadb: "lower(`name`) not like lower(?)",
      mssql: "lower([name]) not like lower(@1)",
      sqlite: 'lower("name") not like lower(?)',
    };

    for (const [dbType, expectedSql] of Object.entries(expected)) {
      expect(
        builderFor(dbType as SqlDataSourceType)
          .whereNotILike("name", "%jo%")
          .toSql().sql,
      ).toContain(expectedSql);
    }
  });

  it("lowers both sides of a column-to-column comparison", () => {
    expect(
      builderFor("mysql").where("name", "ilike", new RawNode("`email`")).toSql()
        .sql,
    ).toContain("lower(`name`) like lower(`email`)");
    expect(
      builderFor("mssql").where("name", "ilike", new RawNode("[email]")).toSql()
        .sql,
    ).toContain("lower([name]) like lower([email])");
  });

  it("still binds a single placeholder, so parameter counts do not shift", () => {
    const { sql, bindings } = builderFor("mssql")
      .where("id", 1)
      .andWhereILike("name", "%jo%")
      .toSql();

    expect(sql).toContain("lower([name]) like lower(@2)");
    expect(bindings).toEqual([1, "%jo%"]);
  });

  it("routes a grouped condition through the same emulation", () => {
    expect(
      builderFor("mysql")
        .where((qb: any) => qb.whereILike("name", "%jo%"))
        .toSql().sql,
    ).toContain("lower(`name`) like lower(?)");
  });
});

describe("placeholder numbering across mixed clauses", () => {
  it("numbers a JSON condition before a later typed condition", () => {
    const { sql, bindings } = builderFor("postgres")
      .whereJsonObject("meta", { a: 1 })
      .where("name", "abc")
      .toSql();

    expect(sql).toContain('"meta" = $1::jsonb');
    expect(sql).toContain('"name" = $2');
    expect(bindings).toEqual([JSON.stringify({ a: 1 }), "abc"]);
  });

  it("numbers consecutive JSON conditions in order", () => {
    const { sql } = builderFor("postgres")
      .whereJsonPath("meta", "a.b", "=", "x")
      .andWhereJsonObject("meta", { c: 2 })
      .toSql();

    expect(sql).toContain(`"meta"->'a'->>'b' = $1`);
    expect(sql).toContain('"meta" = $2::jsonb');
  });

  it("numbers has-none keys before a later typed condition", () => {
    const { sql, bindings } = builderFor("postgres")
      .whereJsonHasNone("meta", ["a", "b"])
      .where("name", "abc")
      .toSql();

    expect(sql).toContain('not (jsonb_exists_any("meta", array[$1, $2]))');
    expect(sql).toContain('"name" = $3');
    expect(bindings).toEqual(["a", "b", "abc"]);
  });

  it("renders superset and-or variants with the right chain", () => {
    const andSql = builderFor("postgres")
      .where("id", 1)
      .andWhereJsonSupersetOf("meta", { a: 1 })
      .toSql().sql;
    expect(andSql).toContain('and "meta" @> $2::jsonb');

    const orSql = builderFor("postgres")
      .where("id", 1)
      .orWhereJsonNotSupersetOf("meta", { a: 1 })
      .toSql().sql;
    expect(orSql).toContain('or not ("meta" @> $2::jsonb)');
  });
});

describe("columnInfo()", () => {
  const canned = [
    {
      name: "id",
      dataType: "integer",
      isNullable: false,
      defaultValue: null,
    },
    {
      name: "email",
      dataType: "text",
      isNullable: true,
      defaultValue: null,
    },
  ];

  const builderWithInfo = <D extends SqlDataSourceType>(dbType: D) =>
    new QueryBuilder<any, Record<string, any>, D>(Users, {
      getDbType: () => dbType,
      getSlave: () => null,
      getTableInfo: async () => canned,
    } as unknown as SqlDataSource);

  it("returns every column when no column is given", async () => {
    const info = await builderWithInfo("postgres").columnInfo();
    expect(info).toEqual(canned);
  });

  it("returns a single column when a name is given", async () => {
    const info = await builderWithInfo("postgres").columnInfo("email");
    expect(info).toEqual(canned[1]);
  });

  it("returns undefined for an unknown column", async () => {
    const info = await builderWithInfo("postgres").columnInfo("nope");
    expect(info).toBeUndefined();
  });
});

describe("whereNot() with a callback", () => {
  it("negates the whole group on every dialect", () => {
    const expected = {
      postgres: 'not ("name" = $1 or "score" > $2)',
      cockroachdb: 'not ("name" = $1 or "score" > $2)',
      mysql: "not (`name` = ? or `score` > ?)",
      mariadb: "not (`name` = ? or `score` > ?)",
      sqlite: 'not ("name" = ? or "score" > ?)',
      mssql: "not ([name] = @1 or [score] > @2)",
    } as const;

    for (const [dbType, fragment] of Object.entries(expected)) {
      const { sql, bindings } = builderFor(dbType as SqlDataSourceType)
        .select("*")
        .whereNot((qb) => qb.where("name", "=", "a").orWhere("score", ">", 1))
        .toSql();

      expect(sql).toContain(fragment);
      expect(bindings).toEqual(["a", 1]);
    }
  });

  it("keeps a two-argument call on the subquery path", () => {
    const { sql } = builderFor("postgres")
      .select("*")
      .whereNot("id", (qb) => qb.table("users").select("id"))
      .toSql();

    expect(sql).toContain("not in (");
    expect(sql).not.toContain("not (");
  });
});

describe("object-shorthand where()", () => {
  it("maps bare values to equality", () => {
    const { sql, bindings } = builderFor("postgres")
      .select("*")
      .where({ name: "ana", score: 3 })
      .toSql();

    expect(sql).toContain('"name" = $1 and "score" = $2');
    expect(bindings).toEqual(["ana", 3]);
  });

  it("honours the { op, value } form", () => {
    const { sql, bindings } = builderFor("mysql")
      .select("*")
      .where({ score: { op: "$gte", value: 3 }, name: { op: "$is not null" } })
      .toSql();

    expect(sql).toContain("`score` >= ? and `name` is not null");
    expect(bindings).toEqual([3]);
  });

  it("groups $or entries into a parenthesised branch", () => {
    const { sql, bindings } = builderFor("postgres")
      .select("*")
      .where({ $or: [{ name: "ana" }, { score: 1 }] })
      .toSql();

    expect(sql).toContain('("name" = $1 or "score" = $2)');
    expect(bindings).toEqual(["ana", 1]);
  });

  it("nests $and inside $or", () => {
    const { sql } = builderFor("postgres")
      .select("*")
      .where({
        $or: [{ $and: [{ name: "ana" }, { score: 1 }] }, { name: "bob" }],
      })
      .toSql();

    expect(sql).toContain('("name" = $1 and "score" = $2) or "name" = $3');
  });

  it("matches null values with is null", () => {
    const { sql } = builderFor("postgres")
      .select("*")
      .where({ name: null })
      .toSql();

    expect(sql).toContain('"name" is null');
  });
});

describe("tuple IN", () => {
  it("quotes each tuple column separately", () => {
    const expected = {
      postgres: '("id", "name") in (($1, $2), ($3, $4))',
      mysql: "(`id`, `name`) in ((?, ?), (?, ?))",
      sqlite: '("id", "name") in ((?, ?), (?, ?))',
    } as const;

    for (const [dbType, fragment] of Object.entries(expected)) {
      const { sql, bindings } = builderFor(dbType as SqlDataSourceType)
        .select("*")
        .whereIn(
          ["id", "name"],
          [
            [1, "a"],
            [2, "b"],
          ],
        )
        .toSql();

      expect(sql).toContain(fragment);
      expect(bindings).toEqual([1, "a", 2, "b"]);
    }
  });

  it("expands tuples into equality groups on mssql, which has no row constructors", () => {
    const { sql, bindings } = builderFor("mssql")
      .select("*")
      .whereIn(
        ["id", "name"],
        [
          [1, "a"],
          [2, "b"],
        ],
      )
      .toSql();

    expect(sql).toContain(
      "where ([id] = @1 and [name] = @2) or ([id] = @3 and [name] = @4)",
    );
    expect(bindings).toEqual([1, "a", 2, "b"]);
  });

  it("negates tuples for whereNotIn", () => {
    const { sql } = builderFor("postgres")
      .select("*")
      .whereNotIn(["id", "name"], [[1, "a"]])
      .toSql();

    expect(sql).toContain('not (("id", "name") in (($1, $2)))');
  });

  it("chains a second tuple with andWhereIn", () => {
    const { sql } = builderFor("postgres")
      .select("*")
      .where("score", ">", 0)
      .andWhereIn(["id", "name"], [[1, "a"]])
      .toSql();

    expect(sql).toContain('"score" > $1 and ("id", "name") in (($2, $3))');
  });

  it("falls back to an always-false branch for an empty tuple list", () => {
    for (const dbType of ["postgres", "mysql", "mssql", "sqlite"] as const) {
      const { sql, bindings } = builderFor(dbType)
        .select("*")
        .whereIn(["id", "name"], [])
        .toSql();

      expect(sql).toContain("where false");
      expect(bindings).toEqual([]);
    }
  });

  it("falls back to an always-true branch for an empty negated tuple list", () => {
    const { sql } = builderFor("postgres")
      .select("*")
      .whereNotIn(["id", "name"], [])
      .toSql();

    expect(sql).toContain("where true");
  });

  it("rejects an empty column list", () => {
    expect(() =>
      builderFor("postgres")
        .select("*")
        .whereIn([], [[1]]),
    ).toThrow(/WHERE_TUPLE_COLUMNS_REQUIRED/);
  });
});
