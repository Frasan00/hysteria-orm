import { AstParser } from "../../../ast/parser";
import type { FromNode } from "../../../ast/query/node/from";
import { RawNode } from "../../../ast/query/node/raw/raw_node";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class PostgresFromInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const fromNode = node as FromNode;
    const interpreterUtils = new InterpreterUtils(this.model);
    const aliasSql = fromNode.alias
      ? ` as ${interpreterUtils.quoteIdentifier("postgres", fromNode.alias)}`
      : "";

    if (fromNode.table instanceof RawNode) {
      const { sql, bindings } = interpreterUtils.formatRawPlaceholders(
        "postgres",
        fromNode.table.rawValue,
        fromNode.table.bindings ?? [],
        fromNode.currParamIndex,
      );
      return { sql: `${sql}${aliasSql}`, bindings };
    }

    if (typeof fromNode.table === "string") {
      const tableSql = interpreterUtils.formatStringTable(
        "postgres",
        fromNode.schema
          ? `${fromNode.schema}.${fromNode.table}`
          : fromNode.table,
      );

      const onlySql = fromNode.only ? "only " : "";
      return { sql: `${onlySql}${tableSql}${aliasSql}`, bindings: [] };
    }

    const subQueryNodes = Array.isArray(fromNode.table)
      ? fromNode.table
      : [fromNode.table];

    const astParser = new AstParser(
      this.model,
      "postgres" as SqlDataSourceType,
    );
    const result = astParser.parse(subQueryNodes);

    return {
      sql: `(${result.sql})${aliasSql}`,
      bindings: result.bindings,
    };
  }
}

export default new PostgresFromInterpreter();
