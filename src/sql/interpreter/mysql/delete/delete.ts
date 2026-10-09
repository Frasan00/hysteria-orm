import { AstParser } from "../../../ast/parser";
import { DeleteNode } from "../../../ast/query/node/delete";
import { FromNode } from "../../../ast/query/node/from";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MysqlDeleteInterpreter implements Interpreter {
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
    ).getFromForWriteOperations("mysql", deleteNode.fromNode as FromNode);

    if (!deleteNode.joinNodes?.length) {
      return {
        sql: formattedTable,
        bindings: [],
      };
    }

    // MySQL multi-table delete repeats the target: `delete t from t join ...`
    const parsed = new AstParser(this.model, "mysql").parse(
      deleteNode.joinNodes,
      deleteNode.currParamIndex,
    );

    return {
      sql: `${formattedTable} from ${formattedTable} ${parsed.sql}`,
      bindings: parsed.bindings,
    };
  }
}

export default new MysqlDeleteInterpreter();
