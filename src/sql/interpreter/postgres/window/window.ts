import { AstParser } from "../../../ast/parser";
import { WindowFunctionNode } from "../../../ast/query/node/window";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class PostgresWindowInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const windowNode = node as WindowFunctionNode;
    const utils = new InterpreterUtils(this.model);
    const column = (name: string) => utils.formatStringColumn("postgres", name);

    const parts: string[] = [];
    if (windowNode.partitionBy.length) {
      parts.push(
        `partition by ${windowNode.partitionBy.map(column).join(", ")}`,
      );
    }
    if (windowNode.orderBy.length) {
      parts.push(
        `order by ${windowNode.orderBy
          .map((order) =>
            order.order
              ? `${column(order.column)} ${order.order}`
              : column(order.column),
          )
          .join(", ")}`,
      );
    }

    return {
      sql: `${windowNode.fn}() over (${parts.join(" ")})`,
      bindings: [],
    };
  }
}

export default new PostgresWindowInterpreter();
