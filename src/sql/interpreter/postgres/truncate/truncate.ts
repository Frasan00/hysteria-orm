import { AstParser } from "../../../ast/parser";
import { TruncateNode } from "../../../ast/query/node/truncate";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class PostgresTruncateInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const truncateNode = node as TruncateNode;

    if (truncateNode.isRawValue) {
      return {
        sql: truncateNode.table,
        bindings: [],
      };
    }

    const formattedTable = new InterpreterUtils(this.model).formatStringTable(
      "postgres",
      truncateNode.table,
    );

    return {
      sql: formattedTable,
      bindings: [],
    };
  }
}

export default new PostgresTruncateInterpreter();
