import { AstParser } from "../../../src/sql/ast/parser";
import { ConstraintNode } from "../../../src/sql/ast/query/node/constraint";
import { FromNode } from "../../../src/sql/ast/query/node/from";
import {
  registerSqlFuncRenderer,
  SqlFuncNode,
  sqlFunc,
} from "../../../src/sql/ast/query/node/sqlfunc/sqlfunc";
import { UpdateNode } from "../../../src/sql/ast/query/node/update";
import { Model } from "../../../src/sql/models/model";

const stubModel = {
  table: "t",
  databaseCaseConvention: "preserve",
  modelCaseConvention: "preserve",
} as typeof Model;

const render = (dbType: string, nodes: any[]): string =>
  new AstParser(stubModel, dbType as any).parse(nodes, 1, true).sql;

describe("sqlFunc symbolic tokens — per-dialect render", () => {
  test("$now renders valid per-dialect current-timestamp expressions", () => {
    expect(render("postgres", [sqlFunc.now()])).toBe("now()");
    expect(render("mysql", [sqlFunc.now()])).toBe("now()");
    expect(render("mariadb", [sqlFunc.now()])).toBe("now()");
    expect(render("mssql", [sqlFunc.now()])).toBe("current_timestamp");
    expect(render("sqlite", [sqlFunc.now()])).toBe("current_timestamp");
  });

  test("$currentTimestamp renders per-dialect", () => {
    expect(render("postgres", [sqlFunc.currentTimestamp()])).toBe(
      "current_timestamp",
    );
    expect(render("mssql", [sqlFunc.currentTimestamp()])).toBe(
      "current_timestamp",
    );
    expect(render("sqlite", [sqlFunc.currentTimestamp()])).toBe(
      "current_timestamp",
    );
  });

  test("$uuid renders per-dialect UUID generators", () => {
    expect(render("postgres", [sqlFunc.uuid()])).toBe("gen_random_uuid()");
    expect(render("mssql", [sqlFunc.uuid()])).toBe("NEWID()");
    expect(render("sqlite", [sqlFunc.uuid()])).toBe(
      "lower(hex(randomblob(16)))",
    );
  });

  test("$uuid renders a native default on mysql/mariadb", () => {
    expect(render("mysql", [sqlFunc.uuid()])).toBe("(uuid())");
    expect(render("mariadb", [sqlFunc.uuid()])).toBe("(uuid())");
  });

  test("arbitrary function nodes render fn(args)", () => {
    const node = new SqlFuncNode("coalesce", ["a", "b"]);
    expect(render("postgres", [node])).toBe("coalesce('a', 'b')");
  });
});

describe("sqlFunc in UPDATE SET", () => {
  test("update set renders the token inline per dialect", () => {
    const node = () =>
      new UpdateNode(
        new FromNode("posts"),
        ["updated_at"],
        [sqlFunc.now()],
        false,
      ) as any;

    expect(render("postgres", [node()])).toBe(
      `"posts" set "updated_at" = now()`,
    );
    expect(render("mysql", [node()])).toBe("`posts` set `updated_at` = now()");
    expect(render("mssql", [node()])).toBe(
      "[posts] set [updated_at] = current_timestamp",
    );
    expect(render("sqlite", [node()])).toBe(
      `"posts" set "updated_at" = current_timestamp`,
    );
  });
});

describe("sqlFunc in column DDL defaults", () => {
  test("default token renders per-dialect in CREATE TABLE column DDL", () => {
    const defaultNode = (dbType: string) =>
      new ConstraintNode("default", {
        defaultValue: sqlFunc.now(),
      }) as any;

    expect(render("postgres", [defaultNode("postgres")])).toBe("default now()");
    expect(render("mysql", [defaultNode("mysql")])).toBe("default now()");
    expect(render("mssql", [defaultNode("mssql")])).toBe(
      "default current_timestamp",
    );
    expect(render("sqlite", [defaultNode("sqlite")])).toBe(
      "default current_timestamp",
    );
  });

  test("uuid default token renders per-dialect", () => {
    const defaultNode = (dbType: string) =>
      new ConstraintNode("default", {
        defaultValue: sqlFunc.uuid(),
      }) as any;

    expect(render("postgres", [defaultNode("postgres")])).toBe(
      "default gen_random_uuid()",
    );
    expect(render("mssql", [defaultNode("mssql")])).toBe("default NEWID()");
    expect(render("sqlite", [defaultNode("sqlite")])).toBe(
      "default lower(hex(randomblob(16)))",
    );
  });
});

describe("custom sqlFunc tokens", () => {
  test("a registered renderer wins for its dialect", () => {
    registerSqlFuncRenderer("postgres", (node) =>
      node.fn === "$tenant" ? "current_setting('app.tenant')" : undefined,
    );

    expect(render("postgres", [new SqlFuncNode("$tenant")])).toBe(
      "current_setting('app.tenant')",
    );
    // A dialect with no renderer falls through to the default fn(args) render.
    expect(render("mysql", [new SqlFuncNode("$tenant")])).toBe("$tenant()");
  });

  test("a renderer returning undefined leaves the built-in tokens intact", () => {
    registerSqlFuncRenderer("postgres", (node) =>
      node.fn === "$tenant" ? "current_setting('app.tenant')" : undefined,
    );

    expect(render("postgres", [sqlFunc.now()])).toBe("now()");
  });

  test('a "*" renderer applies to every dialect', () => {
    registerSqlFuncRenderer("*", (node) =>
      node.fn === "$globalProbe" ? "1" : undefined,
    );

    expect(render("postgres", [new SqlFuncNode("$globalProbe")])).toBe("1");
    expect(render("sqlite", [new SqlFuncNode("$globalProbe")])).toBe("1");
  });
});
