import { AstParser } from "../../../ast/parser";
import type { FromNode } from "../../../ast/query/node/from";
import { RawNode } from "../../../ast/query/node/raw/raw_node";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MySqlFromInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const fromNode = node as FromNode;
    const interpreterUtils = new InterpreterUtils(this.model);
    const aliasSql = fromNode.alias
      ? ` as ${interpreterUtils.quoteIdentifier("mysql", fromNode.alias)}`
      : "";

    if (fromNode.table instanceof RawNode) {
      const { sql, bindings } = interpreterUtils.formatRawPlaceholders(
        "mysql",
        fromNode.table.rawValue,
        fromNode.table.bindings ?? [],
        fromNode.currParamIndex,
      );
      return { sql: `${sql}${aliasSql}`, bindings };
    }

    if (typeof fromNode.table === "string") {
      const tableSql = interpreterUtils.formatStringTable(
        "mysql",
        fromNode.schema
          ? `${fromNode.schema}.${fromNode.table}`
          : fromNode.table,
      );

      return { sql: `${tableSql}${aliasSql}`, bindings: [] };
    }

    const subQueryNodes = Array.isArray(fromNode.table)
      ? fromNode.table
      : [fromNode.table];

    const astParser = new AstParser(this.model, "mysql" as SqlDataSourceType);
    const result = astParser.parse(subQueryNodes);

    return {
      sql: `(${result.sql})${aliasSql}`,
      bindings: result.bindings,
    };
  }
}

export default new MySqlFromInterpreter();
