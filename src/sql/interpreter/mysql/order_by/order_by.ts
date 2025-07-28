import type { OrderByNode } from "../../../ast/query/node/order_by/order_by";
import { QueryNode } from "../../../ast/query/query";
import type { Interpreter } from "../../interpreter";
import { AstParser } from "../../../ast/parser";
import { Model } from "../../../models/model";
import { InterpreterUtils } from "../../interpreter_utils";

class MySqlOrderByInterpreter implements Interpreter {
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
      "mysql",
      orderByNode.column,
    );
    const directionSql = orderByNode.direction.toLowerCase();

    return {
      sql: `${columnSql} ${directionSql}`,
      bindings: [],
    };
  }
}

export default new MySqlOrderByInterpreter();
