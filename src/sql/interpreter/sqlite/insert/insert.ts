import { AstParser } from "../../../ast/parser";
import { InsertNode } from "../../../ast/query/node/insert";
import { RawNode } from "../../../ast/query/node/raw/raw_node";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

/** Node folders that already terminate the source select's FROM clause. */
const SOURCE_TERMINATORS = new Set([
  "where",
  "group_by",
  "having",
  "order_by",
  "limit",
  "offset",
  "union",
]);

class SqliteInsertInterpreter implements Interpreter {
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
      "sqlite",
      insertNode.fromNode,
    );

    const withAst = interpreterUtils.renderWithNodes(
      "sqlite",
      insertNode.withNodes,
      insertNode.currParamIndex,
    );
    const withPrefix = withAst.sql ? `${withAst.sql} ` : "";
    let paramIndex = insertNode.currParamIndex + withAst.bindings.length;

    const allValues: any[] = [];
    let body: string;

    if (insertNode.source) {
      const sourceAst = new AstParser(this.model, "sqlite").parse(
        insertNode.source,
        paramIndex,
      );
      const columns = insertNode.targetColumns?.length
        ? ` (${insertNode.targetColumns
            .map((column) =>
              interpreterUtils.formatStringColumn("sqlite", column),
            )
            .join(", ")})`
        : "";
      // SQLite reads `on conflict` after an INSERT ... SELECT as a join constraint
      // unless the select's FROM clause is already terminated.
      const needsWhereTrue =
        insertNode.disambiguateSource &&
        !insertNode.source.some((sourceNode) =>
          SOURCE_TERMINATORS.has(sourceNode.folder),
        );
      body = `${formattedTable}${columns} ${sourceAst.sql}${needsWhereTrue ? " where true" : ""}`;
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
            interpreterUtils.formatStringColumn("sqlite", column),
          )
          .join(", ");

        const valuesClauses: string[] = [];
        for (const record of insertNode.records) {
          const recordValues = columns.map((column) => record[column]);

          const placeholders: string[] = [];
          for (const value of recordValues) {
            if (value instanceof RawNode) {
              placeholders.push(value.rawValue);
            } else {
              allValues.push(value);
              placeholders.push("?");
            }
          }

          valuesClauses.push(`(${placeholders.join(", ")})`);
        }

        body = `${formattedTable} (${formattedColumns}) VALUES ${valuesClauses.join(", ")}`;
      }
    }

    return {
      sql: `${withPrefix}${body}`,
      bindings: [...withAst.bindings, ...allValues],
    };
  }
}

export default new SqliteInsertInterpreter();
