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

    const withAst = interpreterUtils.renderWithNodes(
      "mssql",
      insertNode.withNodes,
      insertNode.currParamIndex,
    );
    const withPrefix = withAst.sql ? `${withAst.sql} ` : "";
    let paramIndex = insertNode.currParamIndex + withAst.bindings.length;

    const allValues: any[] = [];
    let columnsPart = "";
    let tail: string;

    if (insertNode.source) {
      const sourceAst = new AstParser(this.model, "mssql").parse(
        insertNode.source,
        paramIndex,
      );
      columnsPart = insertNode.targetColumns?.length
        ? ` (${insertNode.targetColumns
            .map((column) =>
              interpreterUtils.formatStringColumn("mssql", column),
            )
            .join(", ")})`
        : "";
      tail = sourceAst.sql;
      allValues.push(...sourceAst.bindings);
    } else {
      const columns = insertNode.records.length
        ? Object.keys(insertNode.records[0]).filter(
            (key) => insertNode.records[0][key] !== undefined,
          )
        : [];

      if (!columns.length) {
        tail = "default values";
      } else {
        columnsPart = ` (${columns
          .map((column) => interpreterUtils.formatStringColumn("mssql", column))
          .join(", ")})`;

        const valuesClauses: string[] = [];
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

        tail = `values ${valuesClauses.join(", ")}`;
      }
    }

    let outputPart = "";
    if (!insertNode.disableReturning) {
      const outputColumns = insertNode.returning?.length
        ? insertNode.returning
        : this.getOutputColumns(
            insertNode.source
              ? (insertNode.targetColumns ?? [])
              : Object.keys(insertNode.records[0] ?? {}).filter(
                  (key) => insertNode.records[0][key] !== undefined,
                ),
            interpreterUtils,
          );
      outputPart = ` output ${outputColumns
        .map(
          (column) =>
            `inserted.${interpreterUtils.formatStringColumn("mssql", column)}${interpreterUtils.resolveColumnAlias("mssql", column)}`,
        )
        .join(", ")}`;
    }

    return {
      sql: `${withPrefix}${formattedTable}${columnsPart}${outputPart} ${tail}`,
      bindings: [...withAst.bindings, ...allValues],
    };
  }

  private getOutputColumns(
    insertedColumns: string[],
    interpreterUtils: InterpreterUtils,
  ): string[] {
    const outputColumns = [...insertedColumns];

    const primaryKey = this.model.primaryKey;
    if (primaryKey && !insertedColumns.includes(primaryKey)) {
      outputColumns.push(primaryKey);
    }

    return outputColumns;
  }
}

export default new MssqlInsertInterpreter();
