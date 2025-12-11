import { AstParser } from "../../../ast/parser";
import { OnDuplicateNode } from "../../../ast/query/node/on_duplicate";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

/**
 * Oracle uses MERGE INTO statement for upsert operations
 * MERGE INTO target USING source ON (condition)
 * WHEN MATCHED THEN UPDATE SET ...
 * WHEN NOT MATCHED THEN INSERT (...) VALUES (...)
 *
 * This interpreter generates the ON conflict part similar to PostgreSQL
 * but the actual MERGE syntax construction happens elsewhere
 */
class OracleOnDuplicateInterpreter implements Interpreter {
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
      .map((column) => interpreterUtils.formatStringColumn("oracledb", column))
      .join(" AND ");

    if (onDuplicateNode.mode === "ignore") {
      // For ignore mode in Oracle MERGE, use WHEN NOT MATCHED THEN INSERT
      // and skip WHEN MATCHED clause
      return {
        sql: `on (${formattedConflictColumns})`,
        bindings: [],
      };
    }

    const updateSet = onDuplicateNode.columnsToUpdate
      .map(
        (column) =>
          `target.${interpreterUtils.formatStringColumn("oracledb", column)} = source.${interpreterUtils.formatStringColumn("oracledb", column)}`,
      )
      .join(", ");

    // Oracle MERGE when matched update clause
    const sql = `on (${formattedConflictColumns}) when matched then update set ${updateSet}`;

    return {
      sql,
      bindings: [],
    };
  }
}

export default new OracleOnDuplicateInterpreter();
