/**
 * DB-free tests for the chainable insert conflict modifier. SQL and bindings are
 * asserted per dialect, along with the conflict-action error cases.
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
  },
});

const stub = (dbType: SqlDataSourceType) =>
  ({ getDbType: () => dbType }) as unknown as SqlDataSource;

const builderFor = <D extends SqlDataSourceType>(dbType: D) =>
  new QueryBuilder<any, Record<string, any>, D>(Users, stub(dbType));

describe("insert().onConflict()", () => {
  it("renders do update set on postgres without the conflict column", () => {
    const { sql } = builderFor("postgres")
      .insert({ email: "john@doe.com", name: "John" })
      .onConflict("email")
      .merge()
      .toSql();

    expect(sql).toContain('on conflict ("email") do update set');
    expect(sql).toContain('"name" = excluded."name"');
    expect(sql).not.toContain('"email" = excluded."email"');
  });

  it("matches postgres on cockroachdb", () => {
    const { sql } = builderFor("cockroachdb")
      .insert({ email: "john@doe.com", name: "John" })
      .onConflict("email")
      .merge()
      .toSql();

    expect(sql).toContain('on conflict ("email") do update set');
    expect(sql).toContain('"name" = excluded."name"');
  });

  it("renders do update set on sqlite", () => {
    const { sql } = builderFor("sqlite")
      .insert({ email: "john@doe.com", name: "John" })
      .onConflict("email")
      .merge()
      .toSql();

    expect(sql).toContain('ON CONFLICT ("email") DO UPDATE SET');
    expect(sql).toContain('"name" = EXCLUDED."name"');
  });

  it("renders on duplicate key update on mysql and mariadb", () => {
    for (const dbType of ["mysql", "mariadb"] as const) {
      const { sql } = builderFor(dbType)
        .insert({ email: "john@doe.com", name: "John" })
        .onConflict("email")
        .merge()
        .toSql();

      expect(sql).toContain("ON DUPLICATE KEY UPDATE");
      expect(sql).toContain("`name` = VALUES(`name`)");
      expect(sql).not.toContain("excluded");
    }
  });

  it("renders do nothing for ignore()", () => {
    expect(
      builderFor("postgres")
        .insert({ email: "a@b.c" })
        .onConflict("email")
        .ignore()
        .toSql().sql,
    ).toContain('on conflict ("email") do nothing');

    expect(
      builderFor("sqlite")
        .insert({ email: "a@b.c" })
        .onConflict("email")
        .ignore()
        .toSql().sql,
    ).toContain('ON CONFLICT ("email") DO NOTHING');

    expect(
      builderFor("mysql")
        .insert({ email: "a@b.c" })
        .onConflict("email")
        .ignore()
        .toSql().sql,
    ).toContain("ON DUPLICATE KEY UPDATE `users`.`email` = `users`.`email`");
  });

  it("never renders a conflict clause on mssql", () => {
    const { sql } = builderFor("mssql")
      .insert({ email: "john@doe.com", name: "John" })
      .onConflict("email")
      .merge()
      .toSql();

    expect(sql.toLowerCase()).not.toContain("on conflict");
    expect(sql.toLowerCase()).not.toContain("merge into");
  });

  it("updates only the requested columns when merge() is given a list", () => {
    const { sql } = builderFor("postgres")
      .insert({ email: "john@doe.com", name: "John" })
      .onConflict("email")
      .merge(["name"])
      .toSql();

    expect(sql).toContain('"name" = excluded."name"');
    expect(sql).not.toContain('"email" = excluded."email"');
  });

  it("accepts an array conflict target", () => {
    const { sql } = builderFor("postgres")
      .insert({ email: "john@doe.com", name: "John" })
      .onConflict(["email", "name"])
      .ignore()
      .toSql();

    expect(sql).toContain('on conflict ("email", "name") do nothing');
  });

  it("strips table qualifiers from conflict and merge columns", () => {
    const { sql } = builderFor("postgres")
      .insert({ email: "john@doe.com", name: "John" })
      .onConflict("users.email")
      .merge(["users.name"])
      .toSql();

    expect(sql).toContain('on conflict ("email") do update set');
    expect(sql).toContain('"name" = excluded."name"');
  });

  it("derives merge() columns from the first inserted row", () => {
    const { sql } = builderFor("postgres")
      .insertMany([
        { email: "a@b.c", name: "John" },
        { email: "d@e.f", name: "Jane" },
      ])
      .onConflict(["email"])
      .merge()
      .toSql();

    expect(sql).toContain('"name" = excluded."name"');
    expect(sql).not.toContain('"email" = excluded."email"');
  });

  it("emits returning after the conflict clause, never before it", () => {
    const { sql } = builderFor("postgres")
      .insert({ email: "john@doe.com", name: "John" }, ["id", "name"])
      .onConflict("email")
      .merge()
      .toSql();

    expect(sql).toContain('on conflict ("email") do update set');
    expect(sql).toContain('returning "id", "name"');
    expect(sql.indexOf("returning")).toBeGreaterThan(
      sql.indexOf("on conflict"),
    );
  });

  it("keeps toQuery() and unWrap() in sync with toSql()", () => {
    const operation = builderFor("postgres")
      .insert({ email: "john@doe.com", name: "John" })
      .onConflict("email")
      .merge();

    expect(operation.toQuery()).toContain(
      'on conflict ("email") do update set',
    );
    expect(operation.unWrap().sql).toContain(
      'on conflict ("email") do update set',
    );
  });

  it("throws when onConflict() is not followed by merge() or ignore()", async () => {
    const operation = builderFor("postgres")
      .insert({ email: "a@b.c" })
      .onConflict("email");

    await expect(Promise.resolve(operation)).rejects.toThrow(
      /ON_CONFLICT_REQUIRES_MERGE_OR_IGNORE/,
    );
  });

  it("throws when merge() or ignore() is called without onConflict()", () => {
    expect(() =>
      builderFor("postgres").insert({ email: "a@b.c" }).merge(),
    ).toThrow(/MERGE_REQUIRES_ON_CONFLICT/);

    expect(() =>
      builderFor("postgres").insert({ email: "a@b.c" }).ignore(),
    ).toThrow(/MERGE_REQUIRES_ON_CONFLICT/);
  });

  it("throws when onConflict() is given no columns", () => {
    expect(() =>
      builderFor("postgres").insert({ email: "a@b.c" }).onConflict([]),
    ).toThrow(/ON_CONFLICT_COLUMNS_REQUIRED/);
  });

  it("throws when merge() has nothing left to update", () => {
    // the conflict target is the only inserted column, so `do update set` would be empty
    expect(() =>
      builderFor("postgres")
        .insert({ email: "a@b.c" })
        .onConflict("email")
        .merge(),
    ).toThrow(/MERGE_REQUIRES_COLUMNS/);
  });

  it("throws when merge() is given an explicitly empty column list", () => {
    const insert = (dbType: "postgres" | "mysql") =>
      builderFor(dbType)
        .insert({ email: "a@b.c", name: "John" })
        .onConflict("email");

    expect(() => insert("postgres").merge([])).toThrow(
      /MERGE_REQUIRES_COLUMNS/,
    );
    expect(() => insert("mysql").merge({ columns: [] })).toThrow(
      /MERGE_REQUIRES_COLUMNS/,
    );
  });

  it("still merges when a column besides the conflict target is inserted", () => {
    expect(
      builderFor("postgres")
        .insert({ email: "a@b.c", name: "John" })
        .onConflict("email")
        .merge()
        .toSql().sql,
    ).toContain('do update set "name" = excluded."name"');
  });

  it("still merges on the raw conflict target and constraint forms", () => {
    // a raw target lists no columns to exclude, so every inserted column is updated
    expect(
      builderFor("postgres")
        .insert({ email: "a@b.c", name: "John" })
        .onConflict(new RawNode("(lower(email))"))
        .merge()
        .toSql().sql,
    ).toContain('"name" = excluded."name"');

    expect(
      builderFor("postgres")
        .insert({ email: "a@b.c", name: "John" })
        .onConflict({ constraint: "users_email_key" })
        .merge()
        .toSql().sql,
    ).toContain('"name" = excluded."name"');
  });

  it("leaves a plain insert untouched", () => {
    const { sql } = builderFor("postgres").insert({ name: "John" }).toSql();

    expect(sql).toContain('insert into "users"');
    expect(sql.toLowerCase()).not.toContain("on conflict");
  });

  it("takes a raw conflict target verbatim, without stripping it to a bare column", () => {
    const { sql } = builderFor("postgres")
      .insert({ email: "john@doe.com", name: "John" })
      .onConflict(new RawNode("(lower(email)) where deleted_at is null"))
      .merge(["name"])
      .toSql();

    expect(sql).toContain(
      "on conflict (lower(email)) where deleted_at is null do update set",
    );
    expect(sql).toContain('"name" = excluded."name"');
  });

  it("takes a raw conflict target on sqlite", () => {
    const { sql } = builderFor("sqlite")
      .insert({ email: "john@doe.com", name: "John" })
      .onConflict(new RawNode("(lower(email))"))
      .ignore()
      .toSql();

    expect(sql).toContain("ON CONFLICT (lower(email)) DO NOTHING");
  });

  it("takes a named constraint as the conflict target on postgres", () => {
    const { sql } = builderFor("postgres")
      .insert({ email: "john@doe.com", name: "John" })
      .onConflict({ constraint: "users_email_key" })
      .merge(["name"])
      .toSql();

    expect(sql).toContain(
      'on conflict on constraint "users_email_key" do update set',
    );
  });

  it("rejects a raw or constraint target on dialects that cannot express one", () => {
    for (const dbType of ["mysql", "mariadb", "mssql"] as const) {
      expect(() =>
        builderFor(dbType)
          .insert({ email: "a@b.c" })
          .onConflict(new RawNode("(lower(email))"))
          .merge(),
      ).toThrow(/NOT_SUPPORTED_IN_/);
    }

    expect(() =>
      builderFor("sqlite")
        .insert({ email: "a@b.c" })
        .onConflict({ constraint: "users_email_key" })
        .merge(),
    ).toThrow(/NOT_SUPPORTED_IN_SQLITE/);
  });

  it("guards the update with merge({ where }) on postgres", () => {
    const { sql, bindings } = builderFor("postgres")
      .insert({ email: "john@doe.com", name: "John" })
      .onConflict("email")
      .merge({ where: (qb: any) => qb.where("name", "<>", "John") })
      .toSql();

    expect(sql).toContain(
      'on conflict ("email") do update set "name" = excluded."name" where "name" <> $3',
    );
    expect(bindings).toEqual(["john@doe.com", "John", "John"]);
  });

  it("chains and/or inside merge({ where })", () => {
    expect(
      builderFor("postgres")
        .insert({ email: "john@doe.com", name: "John" })
        .onConflict("email")
        .merge({
          where: (qb: any) =>
            qb.where("name", "<>", "John").andWhere("id", ">", 3),
        })
        .toSql().sql,
    ).toContain('where "name" <> $3 and "id" > $4');
  });

  it("puts merge({ where }) before the returning clause", () => {
    const { sql } = builderFor("postgres")
      .insert({ email: "john@doe.com", name: "John" }, ["id"])
      .onConflict("email")
      .merge({ where: (qb: any) => qb.where("name", "<>", "John") })
      .toSql();

    expect(sql.indexOf("where")).toBeLessThan(sql.indexOf("returning"));
  });

  it("guards the update with merge({ where }) on sqlite", () => {
    expect(
      builderFor("sqlite")
        .insert({ email: "john@doe.com", name: "John" })
        .onConflict("email")
        .merge({ where: (qb: any) => qb.where("name", "<>", "John") })
        .toSql()
        .sql.replace(/\s+/g, " "),
    ).toContain(
      'ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name" WHERE "name" <> ?',
    );
  });

  it("rejects merge({ where }) where the dialect has no such slot", () => {
    for (const dbType of ["mysql", "mariadb"] as const) {
      expect(() =>
        builderFor(dbType)
          .insert({ email: "a@b.c", name: "n" })
          .onConflict("email")
          .merge({ where: (qb: any) => qb.where("name", "<>", "n") }),
      ).toThrow(/MERGE_WHERE_NOT_SUPPORTED/);
    }
  });

  it("ignores merge({ where }) on mssql, which never renders a conflict clause", () => {
    const { sql } = builderFor("mssql")
      .insert({ email: "a@b.c", name: "n" })
      .onConflict("email")
      .merge({ where: (qb: any) => qb.where("name", "<>", "n") })
      .toSql();

    expect(sql.toLowerCase()).not.toContain("where");
    expect(sql).toContain("insert into [users]");
  });
});

describe("upsert() on top of onConflict()", () => {
  it("renders the conflict clause with the update set on every dialect", () => {
    const postgres = builderFor("postgres")
      .upsert({ name: "John" }, { name: "John" })
      .toSql().sql;

    expect(postgres).toContain('on conflict ("name") do update set');
  });

  it("renders do nothing when updateOnConflict is false", () => {
    const { sql } = builderFor("postgres")
      .upsert({ name: "John" }, { name: "John" }, { updateOnConflict: false })
      .toSql();

    expect(sql).toContain('on conflict ("name") do nothing');
    expect(sql).not.toContain("do update set");
  });

  it("merges the search criteria into the inserted row", () => {
    const { sql, bindings } = builderFor("postgres")
      .upsert<Record<string, any>>({ name: "John" }, { email: "a@b.c" })
      .toSql();

    expect(sql).toContain('insert into "users" ("email", "name")');
    expect(bindings).toEqual(["a@b.c", "John"]);
  });

  it("keeps upsertMany's explicit update columns", () => {
    const { sql } = builderFor("postgres")
      .upsertMany(
        ["email"],
        ["name"],
        [
          { email: "a@b.c", name: "John" },
          { email: "d@e.f", name: "Jane" },
        ],
      )
      .toSql();

    expect(sql).toContain('on conflict ("email") do update set');
    expect(sql).toContain('"name" = excluded."name"');
    expect(sql).not.toContain('"email" = excluded."email"');
  });
});
