import { AstParser } from "../../../ast/parser";
import { OnDuplicateNode } from "../../../ast/query/node/on_duplicate";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MysqlOnDuplicateInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const onDuplicateNode = node as OnDuplicateNode;

    if (onDuplicateNode.isRawValue) {
      return {
        sql: onDuplicateNode.table,
        bindings: [],
      };
    }

    const interpreterUtils = new InterpreterUtils(this.model);

    if (onDuplicateNode.mode === "ignore") {
      return {
        sql: "ON DUPLICATE KEY IGNORE",
        bindings: [],
      };
    }

    const formattedColumns = onDuplicateNode.columnsToUpdate
      .map(
        (column) =>
          `${interpreterUtils.formatStringColumn("mysql", column)} = new.${interpreterUtils.formatStringColumn("mysql", column)}`,
      )
      .join(", ");

    return {
      sql: `AS new ON DUPLICATE KEY UPDATE ${formattedColumns}`,
      bindings: [],
    };
  }
}

export default new MysqlOnDuplicateInterpreter();
