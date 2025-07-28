import { AstParser } from "../../../ast/parser";
import type { OrderByNode } from "../../../ast/query/node/order_by/order_by";
import { QueryNode } from "../../../ast/query/query";
import type { Interpreter } from "../../interpreter";
import { Model } from "../../../models/model";
import { InterpreterUtils } from "../../interpreter_utils";

class SqliteOrderByInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const orderByNode = node as OrderByNode;
    if (orderByNode.isRawValue) {
      return {
        sql: orderByNode.column,
        bindings: [],
      };
    }

    const columnSql = new InterpreterUtils(this.model).formatStringColumn(
      "sqlite",
      orderByNode.column,
    );
    const directionSql = orderByNode.direction.toLowerCase();

    return {
      sql: `${columnSql} ${directionSql}`,
      bindings: [],
    };
  }

  private formatColumn(column: string): string {
    const hasTable = column.includes(".");
    if (hasTable) {
      const [table, foundColumn] = column.split(".");
      return `"${table}"."${foundColumn}"`;
    }
    return `"${column}"`;
  }
}

export default new SqliteOrderByInterpreter();
