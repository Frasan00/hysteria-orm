import { AstParser } from "../../../ast/parser";
import { UnionNode } from "../../../ast/query/node";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class OracleUnionInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const unionNode = node as UnionNode;
    const parser = new AstParser(this.model, "oracledb");
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

export default new OracleUnionInterpreter();
