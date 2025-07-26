import { AstParser } from "../../../ast/parser";
import { OnDuplicateNode } from "../../../ast/query/node/on_duplicate";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class SqliteOnDuplicateInterpreter implements Interpreter {
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
    const formattedConflictColumns = onDuplicateNode.conflictColumns
      .map((column) => interpreterUtils.formatStringColumn("sqlite", column))
      .join(", ");

    if (onDuplicateNode.mode === "ignore") {
      return {
        sql: `ON CONFLICT (${formattedConflictColumns}) DO NOTHING`,
        bindings: [],
      };
    }

    const updateSet = onDuplicateNode.columnsToUpdate
      .map(
        (column) =>
          `${interpreterUtils.formatStringColumn("sqlite", column)} = EXCLUDED.${interpreterUtils.formatStringColumn("sqlite", column)}`,
      )
      .join(", ");

    return {
      sql: `ON CONFLICT (${formattedConflictColumns}) DO UPDATE SET ${updateSet}`,
      bindings: [],
    };
  }
}

export default new SqliteOnDuplicateInterpreter();
