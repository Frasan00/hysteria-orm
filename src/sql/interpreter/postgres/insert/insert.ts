import { AstParser } from "../../../ast/parser";
import { InsertNode } from "../../../ast/query/node/insert";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class PostgresInsertInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const insertNode = node as InsertNode;
    if (insertNode.isRawValue) {
      return {
        sql: insertNode.table,
        bindings: [],
      };
    }

    const interpreterUtils = new InterpreterUtils(this.model);
    const formattedTable = interpreterUtils.formatStringTable(
      "postgres",
      insertNode.table,
    );

    if (!insertNode.records.length) {
      return {
        sql: formattedTable,
        bindings: [],
      };
    }

    const firstRecord = insertNode.records[0];
    const columns = Object.keys(firstRecord);
    if (!columns.length) {
      return {
        sql: formattedTable,
        bindings: [],
      };
    }

    const formattedColumns = columns
      .map((column) => interpreterUtils.formatStringColumn("postgres", column))
      .join(", ");

    const allValues: any[] = [];
    const valuesClauses: string[] = [];
    let paramIndex = insertNode.currParamIndex;

    for (const record of insertNode.records) {
      const recordValues = columns.map((column) => record[column]);
      allValues.push(...recordValues);

      const placeholders = columns
        .map((_, i) => {
          const value = recordValues[i];
          return `$${paramIndex++}${this.formatTypeCast(value)}`;
        })
        .join(", ");

      valuesClauses.push(`(${placeholders})`);
    }

    let sql = `${formattedTable} (${formattedColumns}) values ${valuesClauses.join(", ")}`;

    if (!insertNode.disableReturning) {
      if (insertNode.returning && insertNode.returning.length) {
        const returningCols = insertNode.returning
          .map((column) =>
            interpreterUtils.formatStringColumn("postgres", column),
          )
          .join(", ");
        sql += ` returning ${returningCols}`;
      } else {
        sql += " returning *";
      }
    }

    return {
      sql,
      bindings: allValues,
    };
  }

  private formatTypeCast(value: any): string {
    let typeCast = "";
    if (Buffer.isBuffer(value)) {
      typeCast = "::bytea";
    } else if (Array.isArray(value)) {
      typeCast = "::array";
    } else if (
      typeof value === "object" &&
      value !== null &&
      !(value instanceof Date)
    ) {
      typeCast = "::jsonb";
    } else if (typeof value === "boolean") {
      typeCast = "::boolean";
    } else if (typeof value === "bigint") {
      typeCast = "::bigint";
    }

    return typeCast;
  }
}

export default new PostgresInsertInterpreter();
