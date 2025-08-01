import { AstParser } from "../../../ast/parser";
import type { FromNode } from "../../../ast/query/node/from/from";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MySqlFromInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const fromNode = node as FromNode;

    if (typeof fromNode.table === "string") {
      if (fromNode.alias && fromNode.alias.length > 0) {
        const tableSql = new InterpreterUtils(this.model).formatStringTable(
          "mysql",
          fromNode.table,
        );

        return {
          sql: `${tableSql} as \`${fromNode.alias}\``,
          bindings: [],
        };
      }

      return { sql: fromNode.table, bindings: [] };
    }

    const subQueryNodes = Array.isArray(fromNode.table)
      ? fromNode.table
      : [fromNode.table];

    const astParser = new AstParser(this.model, "mysql" as SqlDataSourceType);
    const result = astParser.parse(subQueryNodes);

    const aliasSql =
      fromNode.alias && fromNode.alias.length
        ? ` as \`${fromNode.alias}\``
        : "";

    return {
      sql: `(${result.sql})${aliasSql}`,
      bindings: result.bindings,
    };
  }
}

export default new MySqlFromInterpreter();
