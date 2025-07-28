import { AstParser } from "../../../ast/parser";
import type { SelectNode } from "../../../ast/query/node/select/basic_select";
import { QueryNode } from "../../../ast/query/query";
import { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";
import { Model } from "../../../models/model";
import { InterpreterUtils } from "../../interpreter_utils";

class SqliteSelectInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const selectNode = node as SelectNode;
    if (selectNode.isRawValue) {
      return {
        sql: selectNode.column as string,
        bindings: [],
      };
    }

    const columnSql = this.formatColumn(
      selectNode.column,
      selectNode.sqlFunction,
    );
    const aliasSql = this.formatAlias(selectNode.alias);
    return {
      sql: `${columnSql}${aliasSql}`,
      bindings: [],
    };
  }

  private formatColumn(
    column: string | QueryNode | QueryNode[],
    sqlFunction?: string,
  ): string {
    if (typeof column === "string") {
      const col = new InterpreterUtils(this.model).formatStringColumn(
        "sqlite",
        column,
      );
      if (sqlFunction) {
        return `${sqlFunction.toLowerCase()}(${col})`;
      }
      return col;
    }

    if (!Array.isArray(column)) {
      column = [column];
    }

    const formattedColumns = column.map((col) => {
      if (typeof col === "string") {
        const formatted = new InterpreterUtils(this.model).formatStringColumn(
          "sqlite",
          col,
        );
        if (sqlFunction) {
          return `${sqlFunction.toLowerCase()}(${formatted})`;
        }
        return formatted;
      }

      const astParser = new AstParser(
        this.model,
        "sqlite" as SqlDataSourceType,
      );
      const result = astParser.parse([col]);
      let sql = `(${result.sql})`;
      if (sqlFunction) {
        sql = `${sqlFunction.toLowerCase()}${sql}`;
      }
      return sql;
    });

    return formattedColumns.join(", ");
  }

  private formatAlias(alias?: string): string {
    if (alias && alias.length > 0) {
      return ` as "${alias}"`;
    }
    return "";
  }
}

export default new SqliteSelectInterpreter();
