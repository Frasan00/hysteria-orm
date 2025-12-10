import { AstParser } from "../../../ast/parser";
import { WithNode } from "../../../ast/query/node";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";
import logger from "../../../../utils/logger";

class MssqlWithInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(
    node: QueryNode | string,
  ): ReturnType<typeof AstParser.prototype.parse> {
    const withNode = node as WithNode;
    const parser = new AstParser(this.model, "mssql");
    const nodes = Array.isArray(withNode.body)
      ? withNode.body
      : [withNode.body];

    const ast = parser.parse(
      nodes.filter(Boolean) as QueryNode[],
      withNode.currParamIndex,
    );

    if (withNode.clause === "materialized") {
      logger.warn(
        "MSSQL does not support MATERIALIZED CTEs. The clause will be ignored.",
      );
    }

    return {
      sql: `[${withNode.alias}] as (${ast.sql})`,
      bindings: ast.bindings,
    };
  }
}

export default new MssqlWithInterpreter();
