import { AstParser } from "../../../ast/parser";
import { RawNode } from "../../../ast/query/node/raw/raw_node";
import {
  renderCustomSqlFunc,
  SqlFuncNode,
} from "../../../ast/query/node/sqlfunc/sqlfunc";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";
import type { SqlDataSourceType } from "../../../sql_data_source_types";

class MysqlSqlFuncInterpreter implements Interpreter {
  declare model: typeof Model;
  declare dbType?: SqlDataSourceType;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const sqlFuncNode = node as SqlFuncNode;

    const customSql = renderCustomSqlFunc(this.dbType, sqlFuncNode);
    if (customSql !== undefined) {
      return { sql: customSql, bindings: [] };
    }

    const token = this.renderToken(sqlFuncNode.fn);
    if (token !== undefined) {
      return { sql: token, bindings: [] };
    }

    const args = sqlFuncNode.args
      .map((arg) => {
        if (arg instanceof RawNode) return arg.rawValue;
        if (arg instanceof SqlFuncNode) return this.toSql(arg).sql;
        if (typeof arg === "number") return String(arg);
        return `'${arg}'`;
      })
      .join(", ");
    return { sql: `${sqlFuncNode.fn}(${args})`, bindings: [] };
  }

  private renderToken(fn: string): string | undefined {
    switch (fn) {
      case "$uuid":
        // MySQL 8.0.13+ / MariaDB accept this as a CREATE TABLE column default.
        // The ALTER ADD path strips it (ERROR 1674) — see
        // interpreter/mysql/alter_table/add_column.ts.
        return "(uuid())";
      case "$now":
        return "now()";
      case "$currentTimestamp":
        return "current_timestamp";
      default:
        return undefined;
    }
  }
}

export default new MysqlSqlFuncInterpreter();
