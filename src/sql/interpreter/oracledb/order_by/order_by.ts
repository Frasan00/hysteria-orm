import { AstParser } from "../../../ast/parser";
import type { OrderByNode } from "../../../ast/query/node/order_by/order_by";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class OracleOrderByInterpreter implements Interpreter {
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
      "oracledb",
      orderByNode.column,
    );
    const directionSql = orderByNode.direction.toLowerCase();

    return {
      sql: `${columnSql} ${directionSql}`,
      bindings: [],
    };
  }
}

export default new OracleOrderByInterpreter();
