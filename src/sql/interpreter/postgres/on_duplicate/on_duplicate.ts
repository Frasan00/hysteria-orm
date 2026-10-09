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
      .map((column) =>
        interpreterUtils.formatStringColumnBare("postgres", column),
      )
      .join(", ");

    let conflictTarget = "";
    if (onDuplicateNode.conflictConstraint) {
      conflictTarget = ` on constraint ${interpreterUtils.formatStringColumnBare("postgres", onDuplicateNode.conflictConstraint)}`;
    } else if (onDuplicateNode.conflictTargetRaw) {
      conflictTarget = ` ${onDuplicateNode.conflictTargetRaw}`;
    } else if (formattedConflictColumns) {
      conflictTarget = ` (${formattedConflictColumns})`;
    }

    const whereClause = this.renderMergeWhere(onDuplicateNode);

    if (onDuplicateNode.mode === "ignore") {
      let sql = `on conflict${conflictTarget} do nothing`;
      sql += this.renderReturning(onDuplicateNode);
      return {
        sql,
        bindings: whereClause.bindings,
      };
    }

    const updateSet = onDuplicateNode.columnsToUpdate
      .map(
        (column) =>
          `${interpreterUtils.formatStringColumnBare("postgres", column)} = excluded.${interpreterUtils.formatStringColumnBare("postgres", column)}`,
      )
      .join(", ");

    let sql = `on conflict${conflictTarget} do update set ${updateSet}${whereClause.sql}`;
    sql += this.renderReturning(onDuplicateNode);

    return {
      sql,
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

    const parsed = new AstParser(this.model, "postgres").parse(
      onDuplicateNode.whereNodes,
      onDuplicateNode.currParamIndex,
      true,
    );

    return {
      sql: parsed.sql ? ` where ${parsed.sql}` : "",
      bindings: parsed.bindings,
    };
  }

  private renderReturning(onDuplicateNode: OnDuplicateNode): string {
    if (!onDuplicateNode.returning?.length) {
      return "";
    }

    const columns = onDuplicateNode.returning
      .map((column) =>
        new InterpreterUtils(this.model).formatStringColumn("postgres", column),
      )
      .join(", ");

    return ` returning ${columns}`;
  }
}

export default new PostgresOnDuplicateInterpreter();
