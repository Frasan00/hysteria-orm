import { AstParser } from "../../../ast/parser";
import { RawNode } from "../../../ast/query/node/raw/raw_node";
import { SqlFuncNode } from "../../../ast/query/node/sqlfunc/sqlfunc";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MysqlSqlFuncInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const sqlFuncNode = node as SqlFuncNode;
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
        throw new Error(
          "hysteria-orm: $uuid has no mysql/mariadb default — uuid columns must be generated in JS",
        );
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
