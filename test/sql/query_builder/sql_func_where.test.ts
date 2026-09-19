import { AstParser } from "../../../src/sql/ast/parser";
import type { AstParserType } from "../../../src/sql/ast/parser_types";
import { HavingNode } from "../../../src/sql/ast/query/node/having/having";
import { sqlFunc } from "../../../src/sql/ast/query/node/sqlfunc/sqlfunc";
import { WhereNode } from "../../../src/sql/ast/query/node/where/where";
import { QueryNode } from "../../../src/sql/ast/query/query";
import { Model } from "../../../src/sql/models/model";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import type { SqlDataSourceType } from "../../../src/sql/sql_data_source_types";

const stubModel = {
  table: "t",
  databaseCaseConvention: "preserve",
  modelCaseConvention: "preserve",
} as typeof Model;

const render = (dbType: SqlDataSourceType, nodes: QueryNode[]): AstParserType =>
  new AstParser(stubModel, dbType).parse(nodes, 1, true);

describe("sqlFunc as a where() right-hand side", () => {
  test("$now renders inline instead of binding an object", () => {
    const node = new WhereNode("created_at", "and", false, "<", sqlFunc.now());
    const { sql, bindings } = render("postgres", [node]);
    expect(sql).toBe('"created_at" < now()');
    expect(bindings).toEqual([]);
  });

  test("$uuid renders per dialect", () => {
    const node = new WhereNode("id", "and", false, "!=", sqlFunc.uuid());
    expect(render("postgres", [node]).sql).toBe('"id" != gen_random_uuid()');
    expect(render("sqlite", [node]).sql).toBe(
      '"id" != lower(hex(randomblob(16)))',
    );
  });

  test("bindings from neighbouring predicates keep their indices", () => {
    const funcNode = new WhereNode(
      "created_at",
      "and",
      false,
      "<",
      sqlFunc.now(),
    );
    const bindNode = new WhereNode("name", "and", false, "=", "alice");
    const { sql, bindings } = render("postgres", [funcNode, bindNode]);
    expect(sql).toContain('"created_at" < now()');
    expect(sql).toContain('"name" = $1');
    expect(bindings).toEqual(["alice"]);
  });
});

describe("sqlFunc as a having() right-hand side", () => {
  test("$now renders inline", () => {
    const node = new HavingNode("total", "and", false, ">", sqlFunc.now());
    const { sql, bindings } = render("postgres", [node]);
    expect(sql).toBe('"total" > now()');
    expect(bindings).toEqual([]);
  });
});

describe("sqlFunc in the public builder surface", () => {
  test("the raw builder accepts a SqlFuncNode where value", () => {
    const sql = new SqlDataSource({ type: "sqlite", database: ":memory:" });
    const built = sql.from("users").where("created_at", sqlFunc.now()).toSql();
    expect(built.sql).toContain("current_timestamp");
    expect(built.sql).not.toContain("?");
    expect(built.bindings).toEqual([]);
  });
});
