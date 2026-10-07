import { AstParser } from "../../../ast/parser";
import { InsertNode } from "../../../ast/query/node/insert";
import { RawNode } from "../../../ast/query/node/raw/raw_node";
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
        sql: insertNode.fromNode.table as string,
        bindings: [],
      };
    }

    const interpreterUtils = new InterpreterUtils(this.model);
    const formattedTable = interpreterUtils.getFromForWriteOperations(
      "postgres",
      insertNode.fromNode,
    );

    const withAst = interpreterUtils.renderWithNodes(
      "postgres",
      insertNode.withNodes,
      insertNode.currParamIndex,
    );
    const withPrefix = withAst.sql ? `${withAst.sql} ` : "";
    let paramIndex = insertNode.currParamIndex + withAst.bindings.length;

    const allValues: any[] = [];
    let body: string;

    if (insertNode.source) {
      const sourceAst = new AstParser(this.model, "postgres").parse(
        insertNode.source,
        paramIndex,
      );
      const columns = insertNode.targetColumns?.length
        ? ` (${insertNode.targetColumns
            .map((column) =>
              interpreterUtils.formatStringColumn("postgres", column),
            )
            .join(", ")})`
        : "";
      body = `${formattedTable}${columns} ${sourceAst.sql}`;
      allValues.push(...sourceAst.bindings);
    } else {
      const columns = insertNode.records.length
        ? Object.keys(insertNode.records[0])
        : [];

      if (!columns.length) {
        body = `${formattedTable} default values`;
      } else {
        const formattedColumns = columns
          .map((column) =>
            interpreterUtils.formatStringColumn("postgres", column),
          )
          .join(", ");

        const valuesClauses: string[] = [];
        const modelColumns =
          typeof this.model?.getColumnsByName === "function"
            ? this.model.getColumnsByName()
            : new Map<string, { type?: unknown }>();

        for (const record of insertNode.records) {
          const recordValues = columns.map((column) => record[column]);

          const placeholders: string[] = [];
          for (let i = 0; i < columns.length; i++) {
            const value = recordValues[i];

            if (value instanceof RawNode) {
              placeholders.push(value.rawValue);
            } else {
              allValues.push(value);
              placeholders.push(
                `$${paramIndex++}${this.formatTypeCast(
                  value,
                  modelColumns.get(columns[i])?.type,
                )}`,
              );
            }
          }

          valuesClauses.push(`(${placeholders.join(", ")})`);
        }

        body = `${formattedTable} (${formattedColumns}) values ${valuesClauses.join(", ")}`;
      }
    }

    let sql = `${withPrefix}${body}`;

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
      bindings: [...withAst.bindings, ...allValues],
    };
  }

  private formatTypeCast(value: any, columnType?: unknown): string {
    if (
      typeof value === "string" &&
      (columnType === "jsonb" || columnType === "json")
    ) {
      return "::text::jsonb";
    }

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
