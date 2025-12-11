import { AstParser } from "../../../ast/parser";
import type { FromNode } from "../../../ast/query/node/from";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class OracleFromInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const fromNode = node as FromNode;

    if (typeof fromNode.table === "string") {
      const interpreterUtils = new InterpreterUtils(this.model);

      if (fromNode.alias && fromNode.alias.length > 0) {
        const tableSql = interpreterUtils.formatStringTable(
          "oracledb",
          fromNode.table,
        );

        return {
          sql: `${tableSql} "${fromNode.alias}"`,
          bindings: [],
        };
      }

      const tableSql = interpreterUtils.formatStringTable(
        "oracledb",
        fromNode.table,
      );

      return { sql: tableSql, bindings: [] };
    }

    const subQueryNodes = Array.isArray(fromNode.table)
      ? fromNode.table
      : [fromNode.table];

    const astParser = new AstParser(
      this.model,
      "oracledb" as SqlDataSourceType,
    );
    const result = astParser.parse(subQueryNodes);

    const aliasSql =
      fromNode.alias && fromNode.alias.length ? ` "${fromNode.alias}"` : "";

    return {
      sql: `(${result.sql})${aliasSql}`,
      bindings: result.bindings,
    };
  }
}

export default new OracleFromInterpreter();
