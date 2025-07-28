import { AstParser } from "../../../ast/parser";
import { DeleteNode } from "../../../ast/query/node/delete";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MysqlDeleteInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const deleteNode = node as DeleteNode;

    if (deleteNode.isRawValue) {
      return {
        sql: deleteNode.table,
        bindings: [],
      };
    }

    const formattedTable = new InterpreterUtils(this.model).formatStringTable(
      "mysql",
      deleteNode.table,
    );

    return {
      sql: formattedTable,
      bindings: [],
    };
  }
}

export default new MysqlDeleteInterpreter();
