import { AstParser } from "../../../ast/parser";
import { UnionNode } from "../../../ast/query/node";
import { QueryNode } from "../../../ast/query/query";
import type { Interpreter } from "../../interpreter";
import { Model } from "../../../models/model";

class SqliteUnionInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const unionNode = node as UnionNode;
    const parser = new AstParser(this.model, "sqlite");
    const nodes = Array.isArray(unionNode.query)
      ? unionNode.query
      : [unionNode.query];

    const ast =
      typeof unionNode.query === "string"
        ? { sql: unionNode.query, bindings: [] }
        : parser.parse(
            nodes.filter(Boolean) as QueryNode[],
            unionNode.currParamIndex,
          );

    return {
      sql: ast.sql,
      bindings: ast.bindings,
    };
  }
}

export default new SqliteUnionInterpreter();
