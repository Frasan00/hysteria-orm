import { AstParser } from "../../../ast/parser";
import { DeleteNode } from "../../../ast/query/node/delete";
import { FromNode } from "../../../ast/query/node/from";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MssqlDeleteInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const deleteNode = node as DeleteNode;

    if (
      deleteNode.isRawValue &&
      typeof deleteNode.fromNode.table === "string"
    ) {
      return {
        sql: deleteNode.fromNode.table,
        bindings: [],
      };
    }

    const formattedTable = new InterpreterUtils(
      this.model,
    ).getFromForWriteOperations("mssql", deleteNode.fromNode as FromNode);

    return {
      sql: formattedTable,
      bindings: [],
    };
  }
}

export default new MssqlDeleteInterpreter();
