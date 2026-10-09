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
      .map((column) =>
        interpreterUtils.formatStringColumnBare("sqlite", column),
      )
      .join(", ");

    let conflictTarget = "";
    if (onDuplicateNode.conflictTargetRaw) {
      conflictTarget = ` ${onDuplicateNode.conflictTargetRaw}`;
    } else if (formattedConflictColumns) {
      conflictTarget = ` (${formattedConflictColumns})`;
    }

    if (onDuplicateNode.mode === "ignore") {
      return {
        sql: `ON CONFLICT${conflictTarget} DO NOTHING`,
        bindings: [],
      };
    }

    const updateSet = onDuplicateNode.columnsToUpdate
      .map(
        (column) =>
          `${interpreterUtils.formatStringColumnBare("sqlite", column)} = EXCLUDED.${interpreterUtils.formatStringColumnBare("sqlite", column)}`,
      )
      .join(", ");

    const whereClause = this.renderMergeWhere(onDuplicateNode);

    return {
      sql: `ON CONFLICT${conflictTarget} DO UPDATE SET ${updateSet}${whereClause.sql}`,
      bindings: whereClause.bindings,
    };
  }

  private renderMergeWhere(onDuplicateNode: OnDuplicateNode): {
    sql: string;
    bindings: any[];
  } {
    if (!onDuplicateNode.whereNodes?.length) {
      return { sql: "", bindings: [] };
    }

    const parsed = new AstParser(this.model, "sqlite").parse(
      onDuplicateNode.whereNodes,
      onDuplicateNode.currParamIndex,
      true,
    );

    return {
      sql: parsed.sql ? ` WHERE ${parsed.sql}` : "",
      bindings: parsed.bindings,
    };
  }
}

export default new SqliteOnDuplicateInterpreter();
