import { AstParser } from "../../../ast/parser";
import { WithNode } from "../../../ast/query/node";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

/**
 * Oracle supports CTEs (WITH clause) since 9i Release 2
 * Syntax: WITH alias AS (subquery), alias2 AS (subquery2) SELECT ...
 * MATERIALIZED hint is supported in Oracle 12c+
 */
class OracleWithInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(
    node: QueryNode | string,
  ): ReturnType<typeof AstParser.prototype.parse> {
    const withNode = node as WithNode;
    const parser = new AstParser(this.model, "oracledb");
    const nodes = Array.isArray(withNode.body)
      ? withNode.body
      : [withNode.body];

    const ast = parser.parse(
      nodes.filter(Boolean) as QueryNode[],
      withNode.currParamIndex,
    );

    // Oracle 12c+ supports MATERIALIZED hint using /*+ MATERIALIZE */
    // but the standard AS MATERIALIZED syntax is not supported
    // Use subquery factoring optimization hints instead if needed
    const materializedClause =
      withNode.clause === "materialized" ? " /*+ MATERIALIZE */" : "";

    return {
      sql: `${withNode.alias} as (${materializedClause}${ast.sql})`,
      bindings: ast.bindings,
    };
  }
}

export default new OracleWithInterpreter();
