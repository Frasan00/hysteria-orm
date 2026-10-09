/**
 * DB-free tests for the write statements rework: CTEs on writes, `insertFrom`,
 * truncate options, target-less conflict and the call-time write guards. SQL and
 * bindings are asserted per dialect; nothing here needs a database.
 */

import { col, defineModel } from "../../../src/sql/models/define_model";
import { QueryBuilder } from "../../../src/sql/query_builder/query_builder";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import type { SqlDataSourceType } from "../../../src/sql/sql_data_source_types";

const Users = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.text(),
    email: col.text(),
  },
});

const stub = (dbType: SqlDataSourceType) =>
  ({ getDbType: () => dbType }) as unknown as SqlDataSource;

const builderFor = <D extends SqlDataSourceType>(dbType: D) =>
  new QueryBuilder<any, Record<string, any>, D>(Users, stub(dbType));

/** Collapses the renderer's cosmetic double spaces so dialect assertions stay readable. */
const sqlOf = (operation: { toSql: () => { sql: string } }): string =>
  operation.toSql().sql.replace(/\s+/g, " ").trim();

const ALL = ["postgres", "mysql", "mariadb", "mssql", "sqlite"] as const;
const NON_MYSQL = ["postgres", "mssql", "sqlite"] as const;

describe("CTEs on writes", () => {
  it("leads the insert on dialects that accept `with ... insert`", () => {
    for (const dbType of NON_MYSQL) {
      const sql = sqlOf(
        (builderFor(dbType) as any)
          .with("c", (qb: any) => qb.select("id"))
          .insert({ name: "John" }),
      );

      expect(sql.startsWith("with ")).toBe(true);
      expect(sql).toContain("insert into");
      expect(sql.indexOf(" as (select")).toBeLessThan(
        sql.indexOf("insert into"),
      );
    }
  });

  it("throws on a values insert in mysql and mariadb", () => {
    for (const dbType of ["mysql", "mariadb"] as const) {
      expect(() =>
        (builderFor(dbType) as any)
          .with("c", (qb: any) => qb.select("id"))
          .insert({ name: "John" })
          .toSql(),
      ).toThrow(/CTE_NOT_SUPPORTED_ON_INSERT/);
    }
  });

  it("sits inline after the column list on a mysql insert ... select", () => {
    const sql = sqlOf(
      (builderFor("mysql") as any)
        .with("c", (qb: any) => qb.select("id"))
        .insertFrom(["id"], (qb: any) => qb.select("id").fromRaw("c")),
    );

    expect(sql).toBe(
      "insert into `users` (`id`) with c as (select `id` from `users`) select `id` from c",
    );
  });

  it("leads the update and the delete", () => {
    for (const dbType of ["postgres", "mysql", "mssql", "sqlite"] as const) {
      const update = sqlOf(
        (builderFor(dbType) as any)
          .with("c", (qb: any) => qb.select("id"))
          .where("id", 1)
          .update({ name: "John" }),
      );
      const del = sqlOf(
        (builderFor(dbType) as any)
          .with("c", (qb: any) => qb.select("id"))
          .where("id", 1)
          .delete(),
      );

      expect(update).toContain("with");
      expect(update.indexOf("with")).toBeLessThan(update.indexOf("update"));
      expect(del.indexOf("with")).toBeLessThan(del.indexOf("delete"));
    }
  });

  it("rejects a CTE on update and delete in mariadb, which has no such syntax", () => {
    for (const method of ["update", "delete"] as const) {
      expect(() =>
        (builderFor("mariadb") as any)
          .with("c", (qb: any) => qb.select("id"))
          .where("id", 1)
          [method](method === "update" ? { name: "John" } : undefined)
          .toSql(),
      ).toThrow(/CTE_NOT_SUPPORTED_ON_WRITE/);
    }
  });

  it("renders an explicit CTE column list", () => {
    const sql = sqlOf(
      (builderFor("postgres") as any)
        .with("c", ["id"], (qb: any) => qb.select("id"))
        .where("id", 1)
        .update({ name: "John" }),
    );

    expect(sql).toContain('with c ("id") as (select "id" from "users")');
  });

  it("keeps CTE bindings ahead of the insert values", () => {
    const { sql, bindings } = (builderFor("postgres") as any)
      .with("c", (qb: any) => qb.select("id").where("id", 7))
      .insert({ name: "John" })
      .toSql();

    expect(sql).toContain('where "id" = $1');
    expect(sql).toContain("values ($2)");
    expect(bindings).toEqual([7, "John"]);
  });

  it("rejects a CTE on truncate", () => {
    expect(() =>
      (builderFor("postgres") as any)
        .with("c", (qb: any) => qb.select("id"))
        .truncate()
        .toSql(),
    ).toThrow(/CTE_NOT_SUPPORTED_ON_TRUNCATE/);
  });
});

describe("insertFrom()", () => {
  it("renders the source select positionally when no target columns are given", () => {
    const sql = sqlOf(
      builderFor("postgres").insertFrom((qb: any) =>
        qb.select("id", "name").table("users"),
      ),
    );

    expect(sql).toBe('insert into "users" select "id", "name" from "users"');
  });

  it("renders the explicit target column list per dialect", () => {
    const expected: Record<string, string> = {
      postgres:
        'insert into "users" ("id", "name") select "id", "name" from "users"',
      mysql:
        "insert into `users` (`id`, `name`) select `id`, `name` from `users`",
      mariadb:
        "insert into `users` (`id`, `name`) select `id`, `name` from `users`",
      mssql:
        "insert into [users] ([id], [name]) select [id], [name] from [users]",
      sqlite:
        'insert into "users" ("id", "name") select "id", "name" from "users"',
    };

    for (const dbType of ALL) {
      expect(
        sqlOf(
          builderFor(dbType).insertFrom(["id", "name"], (qb: any) =>
            qb.select("id", "name").table("users"),
          ),
        ),
      ).toBe(expected[dbType]);
    }
  });

  it("accepts a prebuilt builder as the source", () => {
    const source = builderFor("postgres").select("id").table("users");
    const sql = sqlOf(builderFor("postgres").insertFrom(source));

    expect(sql).toBe('insert into "users" select "id" from "users"');
  });

  it("terminates a sqlite source select so `on conflict` is not read as a join", () => {
    const sql = sqlOf(
      builderFor("sqlite")
        .insertFrom((qb: any) => qb.select("id").table("users"))
        .onConflict("email")
        .ignore(),
    );

    expect(sql).toBe(
      'insert into "users" select "id" from "users" where true ON CONFLICT ("email") DO NOTHING',
    );
  });

  it("does not add the sqlite terminator when the source already ends a clause", () => {
    const limited = sqlOf(
      builderFor("sqlite")
        .insertFrom((qb: any) => qb.select("id").table("users").limit(3))
        .onConflict("email")
        .ignore(),
    );
    const filtered = sqlOf(
      builderFor("sqlite")
        .insertFrom((qb: any) => qb.select("id").table("users").where("id", 1))
        .onConflict("email")
        .ignore(),
    );

    expect(limited).not.toContain("where true");
    expect(limited).toContain("limit ?");
    expect(filtered.match(/where/g)?.length).toBe(1);
  });

  it("chains a conflict action onto the source insert", () => {
    const sql = sqlOf(
      builderFor("postgres")
        .insertFrom((qb: any) => qb.select("id", "name").table("users"))
        .onConflict("email")
        .ignore(),
    );

    expect(sql).toBe(
      'insert into "users" select "id", "name" from "users" on conflict ("email") do nothing',
    );
  });
});

describe("empty writes", () => {
  it("renders `default values` outside mysql and `() values ()` inside it", () => {
    expect(sqlOf(builderFor("postgres").insert({}))).toBe(
      'insert into "users" default values',
    );
    expect(sqlOf(builderFor("sqlite").insert({}))).toBe(
      'insert into "users" default values',
    );
    expect(sqlOf(builderFor("mssql").insert({}))).toBe(
      "insert into [users] default values",
    );
    expect(sqlOf(builderFor("mysql").insert({}))).toBe(
      "insert into `users` () values ()",
    );
  });

  it("rejects an update with no columns", () => {
    for (const dbType of ALL) {
      expect(() => builderFor(dbType).update({}).toSql()).toThrow(
        /UPDATE_REQUIRES_COLUMNS/,
      );
    }
  });
});

describe("target-less onConflict()", () => {
  it("renders `on conflict do nothing` on postgres", () => {
    const sql = sqlOf(
      builderFor("postgres").insert({ email: "a@b.c" }).onConflict().ignore(),
    );

    expect(sql).toBe(
      'insert into "users" ("email") values ($1) on conflict do nothing',
    );
  });

  it("renders `ON CONFLICT DO NOTHING` on sqlite", () => {
    const sql = sqlOf(
      builderFor("sqlite").insert({ email: "a@b.c" }).onConflict().ignore(),
    );

    expect(sql).toBe(
      'insert into "users" ("email") VALUES (?) ON CONFLICT DO NOTHING',
    );
  });

  it("switches to `insert ignore into` on mysql and mariadb", () => {
    for (const dbType of ["mysql", "mariadb"] as const) {
      const sql = sqlOf(
        builderFor(dbType).insert({ email: "a@b.c" }).onConflict().ignore(),
      );

      expect(sql).toBe("insert ignore into `users` (`email`) VALUES (?)");
    }
  });

  it("throws on mssql", () => {
    expect(() =>
      builderFor("mssql").insert({ email: "a@b.c" }).onConflict().ignore(),
    ).toThrow(/NOT_SUPPORTED_IN_MSSQL/);
  });

  it("still requires a target for merge()", () => {
    expect(() =>
      builderFor("postgres").insert({ email: "a@b.c" }).onConflict().merge(),
    ).toThrow(/MERGE_REQUIRES_ON_CONFLICT/);
  });
});

describe("truncate options", () => {
  it("appends the postgres options", () => {
    expect(sqlOf(builderFor("postgres").truncate({ cascade: true }))).toBe(
      'truncate "users" cascade',
    );
    expect(
      sqlOf(builderFor("postgres").truncate({ restartIdentity: true })),
    ).toBe('truncate "users" restart identity');
    expect(
      sqlOf(builderFor("postgres").truncate({ continueIdentity: true })),
    ).toBe('truncate "users" continue identity');
  });

  it("renders a bare truncate when no option is set", () => {
    for (const dbType of ["postgres", "mysql", "mariadb", "mssql"] as const) {
      expect(sqlOf(builderFor(dbType).truncate()).toLowerCase()).toContain(
        "truncate",
      );
    }

    // SQLite has no TRUNCATE and falls back to an unqualified delete
    expect(sqlOf(builderFor("sqlite").truncate())).toBe('DELETE FROM "users"');
  });

  it("rejects options everywhere else", () => {
    for (const dbType of ["mysql", "mariadb", "mssql", "sqlite"] as const) {
      expect(() =>
        builderFor(dbType).truncate({ cascade: true }).toSql(),
      ).toThrow(/TRUNCATE_OPTION_NOT_SUPPORTED/);
    }
  });

  it("rejects the identity options on cockroachdb", () => {
    expect(() =>
      builderFor("cockroachdb").truncate({ restartIdentity: true }).toSql(),
    ).toThrow(/TRUNCATE_OPTION_NOT_SUPPORTED/);

    expect(() =>
      builderFor("cockroachdb").truncate({ cascade: true }).toSql(),
    ).not.toThrow();
  });
});

describe("write clause guards", () => {
  it("rejects joins on updates and deletes outside the mysql family", () => {
    for (const dbType of NON_MYSQL) {
      expect(() =>
        builderFor(dbType)
          .leftJoin("posts", "posts.user_id", "users.id")
          .update({ name: "John" })
          .toSql(),
      ).toThrow(/JOIN_NOT_SUPPORTED_ON_WRITE/);

      expect(() =>
        builderFor(dbType)
          .innerJoin("posts", "posts.user_id", "users.id")
          .delete()
          .toSql(),
      ).toThrow(/JOIN_NOT_SUPPORTED_ON_WRITE/);
    }
  });

  it("rejects select-only clauses on writes", () => {
    for (const dbType of ALL) {
      expect(() =>
        builderFor(dbType).distinct().update({ name: "John" }).toSql(),
      ).toThrow(/SELECT_ONLY_CLAUSE_ON_WRITE/);
      expect(() =>
        builderFor(dbType).groupBy("id").update({ name: "John" }).toSql(),
      ).toThrow(/SELECT_ONLY_CLAUSE_ON_WRITE/);
      expect(() =>
        builderFor(dbType)
          .select("id")
          .union("select 1")
          .update({ name: "John" })
          .toSql(),
      ).toThrow(/SELECT_ONLY_CLAUSE_ON_WRITE/);
    }
  });

  it("rejects order by and limit on writes outside mysql", () => {
    for (const dbType of NON_MYSQL) {
      expect(() =>
        builderFor(dbType)
          .orderBy("id", "desc")
          .update({ name: "John" })
          .toSql(),
      ).toThrow(/ORDER_BY_LIMIT_NOT_SUPPORTED_ON_WRITE/);
      expect(() => builderFor(dbType).limit(5).delete().toSql()).toThrow(
        /ORDER_BY_LIMIT_NOT_SUPPORTED_ON_WRITE/,
      );
    }
  });

  it("keeps mysql's delete ... limit", () => {
    for (const dbType of ["mysql", "mariadb"] as const) {
      const sql = sqlOf(builderFor(dbType).limit(5).delete());

      expect(sql).toBe("delete from `users` limit ?");
    }
  });

  it("keeps mysql's update ... order by", () => {
    const sql = sqlOf(
      builderFor("mysql").orderBy("id", "desc").update({ name: "John" }),
    );

    expect(sql).toBe("update `users` set `name` = ? order by `id` desc");
  });
});
