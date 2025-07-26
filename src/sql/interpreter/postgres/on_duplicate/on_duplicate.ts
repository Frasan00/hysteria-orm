import { AstParser } from "../../../ast/parser";
import { OnDuplicateNode } from "../../../ast/query/node/on_duplicate";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class PostgresOnDuplicateInterpreter implements Interpreter {
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
      .map((column) => interpreterUtils.formatStringColumn("postgres", column))
      .join(", ");

    if (onDuplicateNode.mode === "ignore") {
      return {
        sql: `on conflict (${formattedConflictColumns}) do nothing`,
        bindings: [],
      };
    }

    const updateSet = onDuplicateNode.columnsToUpdate
      .map(
        (column) =>
          `${interpreterUtils.formatStringColumn("postgres", column)} = excluded.${interpreterUtils.formatStringColumn("postgres", column)}`,
      )
      .join(", ");

    let sql = `on conflict (${formattedConflictColumns}) do update set ${updateSet}`;

    if (onDuplicateNode.returning && onDuplicateNode.returning.length) {
      const returningCols = onDuplicateNode.returning
        .map((column) =>
          interpreterUtils.formatStringColumn("postgres", column),
        )
        .join(", ");
      sql += ` returning ${returningCols}`;
    } else {
      sql += " returning *";
    }

    return {
      sql,
      bindings: [],
    };
  }
}

export default new PostgresOnDuplicateInterpreter();
