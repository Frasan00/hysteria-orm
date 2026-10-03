/**
 * DB-free tests for dialect-typed SQL comments and optimizer hints.
 *
 * Comments are native SQL literals whose shape is checked per dialect at the
 * public API (`-- line`, block comments; MySQL/MariaDB add `#` and executable
 * comments; optimizer hints are MySQL/MariaDB only). `comment()` prepends before
 * SELECT, `hintComment()` emits immediately after SELECT. The AST node keeps a
 * plain string, and the emitted SQL is asserted without a live database.
 */

import { defineModel, col } from "../../../src/sql/models/define_model";
import { ModelQueryBuilder } from "../../../src/sql/models/model_query_builder/model_query_builder";
import { QueryBuilder } from "../../../src/sql/query_builder/query_builder";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import type { SqlDataSourceType } from "../../../src/sql/sql_data_source_types";

const Users = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.text(),
  },
});

const stub = (dbType: SqlDataSourceType) =>
  ({ getDbType: () => dbType }) as unknown as SqlDataSource;

const builderFor = <D extends SqlDataSourceType>(dbType: D) =>
  new QueryBuilder<any, Record<string, any>, D>(Users, stub(dbType));

const modelBuilderFor = <D extends SqlDataSourceType>(dbType: D) =>
  new ModelQueryBuilder<any, Record<string, any>, {}, D>(Users, stub(dbType));

const dialects: SqlDataSourceType[] = ["postgres", "mysql", "sqlite", "mssql"];

describe("comment() SQL output", () => {
  dialects.forEach((dbType) => {
    describe(dbType, () => {
      it("renders a block comment before the select keyword", () => {
        const sql = builderFor(dbType)
          .select("id")
          .comment("/* Get active users */")
          .toQuery();

        expect(sql).toContain("/* Get active users */");
        expect(sql.indexOf("/* Get active users */")).toBeLessThan(
          sql.toLowerCase().indexOf("select"),
        );
      });

      it("terminates a line comment with a newline so it cannot swallow the query", () => {
        const sql = builderFor(dbType)
          .select("id")
          .comment("-- Get active users")
          .toQuery();

        expect(sql).toMatch(/-- Get active users\n\s*select/i);
      });

      it("stacks comments, each rendered in order", () => {
        const sql = builderFor(dbType)
          .select("id")
          .comment("-- first")
          .comment("/* second */")
          .toQuery();

        expect(sql).toMatch(/-- first\n\s*\/\* second \*\/\s*select/i);
      });

      it("clearComment() removes the clause", () => {
        const sql = builderFor(dbType)
          .select("id")
          .comment("/* gone */")
          .clearComment()
          .toQuery();

        expect(sql).not.toContain("gone");
      });

      it("clone() preserves comments", () => {
        const sql = builderFor(dbType)
          .select("id")
          .comment("/* c */")
          .clone()
          .toQuery();

        expect(sql).toContain("/* c */");
      });
    });
  });

  it("renders MySQL-only # comments", () => {
    const sql = builderFor("mysql").select("id").comment("# hash").toQuery();

    expect(sql).toMatch(/# hash\n\s*select/i);
  });
});

describe("hintComment() SQL output", () => {
  it("renders /*+ ... */ immediately after the select keyword", () => {
    const sql = builderFor("mysql")
      .select("id")
      .hintComment("/*+ NO_ICP(users) */")
      .toQuery();

    expect(sql).toContain("select /*+ NO_ICP(users) */");
  });

  it("renders the hint before DISTINCT", () => {
    const sql = builderFor("mysql")
      .select("id")
      .distinct()
      .hintComment("/*+ NO_ICP(users) */")
      .toQuery();

    const hintIndex = sql.indexOf("/*+ NO_ICP(users) */");
    expect(hintIndex).toBeGreaterThan(sql.toLowerCase().indexOf("select"));
    expect(hintIndex).toBeLessThan(sql.toLowerCase().indexOf("distinct"));
  });

  it("joins stacked hints into a single hint comment", () => {
    const sql = builderFor("mysql")
      .select("id")
      .hintComment("/*+ NO_ICP(users) */")
      .hintComment("/*+ MAX_EXECUTION_TIME(1000) */")
      .toQuery();

    expect(sql).toContain("/*+ NO_ICP(users) MAX_EXECUTION_TIME(1000) */");
  });

  it("clearHintComment() removes the clause", () => {
    const sql = builderFor("mysql")
      .select("id")
      .hintComment("/*+ NO_ICP(users) */")
      .clearHintComment()
      .toQuery();

    expect(sql).not.toContain("NO_ICP");
  });

  it("clone() preserves hints", () => {
    const sql = builderFor("mysql")
      .select("id")
      .hintComment("/*+ NO_ICP(users) */")
      .clone()
      .toQuery();

    expect(sql).toContain("/*+ NO_ICP(users) */");
  });
});

describe("comment() runtime validation", () => {
  it("rejects a block comment that closes early and injects SQL", () => {
    expect(() =>
      builderFor("postgres").comment("/* a */ drop table x /* b */"),
    ).toThrow();
  });

  it("rejects a line comment containing a newline", () => {
    expect(() => builderFor("postgres").comment("-- a\nselect 1")).toThrow();
  });

  it("rejects a bind placeholder inside a comment", () => {
    expect(() => builderFor("postgres").comment("/* what? */")).toThrow();
  });

  it("rejects an empty or malformed value", () => {
    // @ts-expect-error - empty string is not a valid comment literal
    expect(() => builderFor("postgres").comment("")).toThrow();
    expect(() =>
      builderFor("postgres").comment("just text" as never),
    ).toThrow();
  });

  it("rejects # comments outside MySQL/MariaDB", () => {
    expect(() => builderFor("postgres").comment("# hash" as never)).toThrow();
  });
});

describe("dialect-typed comments", () => {
  it("accepts dialect-valid forms", () => {
    builderFor("postgres").select("id").comment("-- hello");
    builderFor("postgres").select("id").comment("/* hello */");
    builderFor("mysql").select("id").comment("-- hello");
    builderFor("mysql").select("id").comment("# hello");
    builderFor("mysql").select("id").comment("/*!50700 SET NAMES utf8 */");
    builderFor("mysql").select("id").hintComment("/*+ NO_ICP(users) */");
  });

  it("rejects cross-dialect forms at compile time", () => {
    // Never called: the body only needs to type-check, the invalid calls would
    // throw at runtime if executed.
    const typecheckOnly = () => {
      // @ts-expect-error - # comments are MySQL/MariaDB only
      builderFor("postgres").select("id").comment("# hello");
      // @ts-expect-error - MySQL requires whitespace after --
      builderFor("mysql").select("id").comment("--hello");
      // @ts-expect-error - optimizer hints are MySQL/MariaDB only
      builderFor("postgres").select("id").hintComment("/*+ x */");
      // @ts-expect-error - a bare string is not a comment literal
      builderFor("postgres").comment("hello");
    };
    expect(typecheckOnly).toBeDefined();
  });

  it("preserves the dialect through select() on the model builder", () => {
    modelBuilderFor("mysql").select("id").hintComment("/*+ x */");
    // @ts-expect-error - still MySQL-only after select()
    modelBuilderFor("postgres").select("id").hintComment("/*+ x */");
  });

  it("still type-checks when a comment precedes select()", () => {
    const typecheckOnly = () => {
      builderFor("mysql").comment("-- hello").select("id");
      // @ts-expect-error - dialect preserved before select()
      builderFor("postgres").comment("# hello");
    };
    expect(typecheckOnly).toBeDefined();
  });

  it("narrows the comment type from the data source dialect through from()", () => {
    const typecheckOnly = (ds: SqlDataSource<"postgres">) => {
      ds.from("users").select("id").comment("-- ok");
      ds.from(Users).select("id").comment("/* ok */");
      // @ts-expect-error - # comments are MySQL/MariaDB only
      ds.from("users").select("id").comment("# nope");
      // @ts-expect-error - hints are MySQL/MariaDB only
      ds.from("users").hintComment("/*+ x */");
      // @ts-expect-error - dialect survives select() on the model builder too
      ds.from(Users).select("id").comment("# nope");
    };
    expect(typecheckOnly).toBeDefined();
  });
});
