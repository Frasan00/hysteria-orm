import { HysteriaError } from "../../../../errors/hysteria_error";
import { AstParser } from "../../../ast/parser";
import { InsertNode } from "../../../ast/query/node/insert";
import { RawNode } from "../../../ast/query/node/raw/raw_node";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { SqlDataSourceType } from "../../../sql_data_source_types";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MysqlInsertInterpreter implements Interpreter {
  declare model: typeof Model;
  declare dbType?: SqlDataSourceType;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const insertNode = node as InsertNode;

    if (insertNode.isRawValue) {
      return {
        sql: insertNode.fromNode.table as string,
        bindings: [],
      };
    }

    const dbType = this.dbType === "mariadb" ? "mariadb" : "mysql";
    const interpreterUtils = new InterpreterUtils(this.model);
    const formattedTable = interpreterUtils.getFromForWriteOperations(
      dbType,
      insertNode.fromNode,
    );

    // MySQL and MariaDB reject `WITH ... INSERT` and only accept the CTE inline
    // after the column list, which an INSERT ... SELECT provides but VALUES does not.
    if (insertNode.withNodes?.length && !insertNode.source) {
      throw new HysteriaError(
        "MysqlInsertInterpreter",
        "CTE_NOT_SUPPORTED_ON_INSERT",
        new Error(
          "MySQL/MariaDB only support a CTE on INSERT ... SELECT (insertFrom), not on a VALUES insert",
        ),
      );
    }

    const withAst = interpreterUtils.renderWithNodes(
      dbType,
      insertNode.withNodes,
      insertNode.currParamIndex,
    );
    let paramIndex = insertNode.currParamIndex + withAst.bindings.length;

    const allValues: any[] = [];
    let body: string;

    if (insertNode.source) {
      const sourceAst = new AstParser(this.model, dbType).parse(
        insertNode.source,
        paramIndex,
      );
      const columns = insertNode.targetColumns?.length
        ? ` (${insertNode.targetColumns
            .map((column) =>
              interpreterUtils.formatStringColumn(dbType, column),
            )
            .join(", ")})`
        : "";
      const withClause = withAst.sql ? ` ${withAst.sql}` : "";
      body = `${formattedTable}${columns}${withClause} ${sourceAst.sql}`;
      allValues.push(...sourceAst.bindings);
    } else {
      const columns = insertNode.records.length
        ? Object.keys(insertNode.records[0])
        : [];

      if (!columns.length) {
        body = `${formattedTable} () values ()`;
      } else {
        const formattedColumns = columns
          .map((column) => interpreterUtils.formatStringColumn(dbType, column))
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

    const sql = `${body}`;
    // MariaDB 10.5+ supports RETURNING; MySQL never had it
    if (this.dbType === "mariadb" && !insertNode.disableReturning) {
      if (insertNode.returning && insertNode.returning.length) {
        const returningCols = insertNode.returning
          .map((column) =>
            interpreterUtils.formatStringColumn("mariadb", column),
          )
          .join(", ");
        return {
          sql: `${sql} returning ${returningCols}`,
          bindings: [...withAst.bindings, ...allValues],
        };
      }
      return {
        sql: `${sql} returning *`,
        bindings: [...withAst.bindings, ...allValues],
      };
    }

    return {
      sql,
      bindings: [...withAst.bindings, ...allValues],
    };
  }
}

export default new MysqlInsertInterpreter();
