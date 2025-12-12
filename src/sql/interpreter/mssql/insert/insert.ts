import { AstParser } from "../../../ast/parser";
import { InsertNode } from "../../../ast/query/node/insert";
import { RawNode } from "../../../ast/query/node/raw/raw_node";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MssqlInsertInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const insertNode = node as InsertNode;
    if (insertNode.isRawValue) {
      return {
        sql: insertNode.fromNode.table as string,
        bindings: [],
      };
    }

    const interpreterUtils = new InterpreterUtils(this.model);
    const formattedTable = interpreterUtils.getFromForWriteOperations(
      "mssql",
      insertNode.fromNode,
    );

    if (!insertNode.records.length) {
      return {
        sql: formattedTable,
        bindings: [],
      };
    }

    const firstRecord = insertNode.records[0];
    const columns = Object.keys(firstRecord).filter(
      (key) => firstRecord[key] !== undefined,
    );
    if (!columns.length) {
      return {
        sql: formattedTable,
        bindings: [],
      };
    }

    const formattedColumns = columns
      .map((column) => interpreterUtils.formatStringColumn("mssql", column))
      .join(", ");

    const allValues: any[] = [];
    const valuesClauses: string[] = [];
    let paramIndex = insertNode.currParamIndex;

    for (const record of insertNode.records) {
      const recordValues = columns.map((column) => record[column]);

      const placeholders: string[] = [];
      for (const value of recordValues) {
        if (value instanceof RawNode) {
          placeholders.push(value.rawValue);
        } else {
          allValues.push(value);
          placeholders.push(`@${paramIndex++}`);
        }
      }

      valuesClauses.push(`(${placeholders.join(", ")})`);
    }

    let sql = `${formattedTable} (${formattedColumns}) values ${valuesClauses.join(", ")}`;

    if (!insertNode.disableReturning) {
      if (insertNode.returning && insertNode.returning.length) {
        const returningCols = insertNode.returning
          .map(
            (column) =>
              `inserted.${interpreterUtils.formatStringColumn("mssql", column)}`,
          )
          .join(", ");
        sql = sql.replace(`) values`, `) output ${returningCols} values`);
      } else {
        const outputCols = this.getOutputColumns(columns, interpreterUtils);
        sql = sql.replace(`) values`, `) output ${outputCols} values`);
      }
    }

    return {
      sql,
      bindings: allValues,
    };
  }

  private getOutputColumns(
    insertedColumns: string[],
    interpreterUtils: InterpreterUtils,
  ): string {
    const outputColumns = [...insertedColumns];

    const primaryKey = this.model.primaryKey;
    if (primaryKey && !insertedColumns.includes(primaryKey)) {
      outputColumns.push(primaryKey);
    }

    return outputColumns
      .map(
        (column) =>
          `inserted.${interpreterUtils.formatStringColumn("mssql", column)}`,
      )
      .join(", ");
  }
}

export default new MssqlInsertInterpreter();
