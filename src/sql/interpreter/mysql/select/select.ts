import { AstParser } from "../../../ast/parser";
import type { SelectNode } from "../../../ast/query/node/select/basic_select";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MysqlSelectInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const selectNode = node as SelectNode;
    if (selectNode.isRawValue) {
      return {
        sql: selectNode.column as string,
        bindings: [],
      };
    }

    const columnResult = this.formatColumn(
      selectNode.column,
      selectNode.sqlFunction,
    );
    const aliasSql = this.formatAlias(selectNode.alias);
    return {
      sql: `${columnResult.sql}${aliasSql}`,
      bindings: columnResult.bindings,
    };
  }

  private formatColumn(
    column: string | QueryNode | QueryNode[],
    sqlFunction?: string,
  ): ReturnType<typeof AstParser.prototype.parse> {
    if (typeof column === "string") {
      const col = new InterpreterUtils(this.model).formatStringColumn(
        "mysql",
        column,
      );
      let sql = col;
      if (sqlFunction) {
        sql = `${sqlFunction.toLowerCase()}(${col})`;
      }
      return {
        sql,
        bindings: [],
      };
    }

    if (Array.isArray(column) && column.length > 0) {
      const astParser = new AstParser(this.model, "mysql" as SqlDataSourceType);
      const result = astParser.parse(column);
      let sql = `(${result.sql})`;
      if (sqlFunction) {
        sql = `${sqlFunction.toLowerCase()}${sql}`;
      }
      return {
        sql,
        bindings: result.bindings,
      };
    }

    if (!Array.isArray(column)) {
      const astParser = new AstParser(this.model, "mysql" as SqlDataSourceType);
      const result = astParser.parse([column]);
      let sql = `(${result.sql})`;
      if (sqlFunction) {
        sql = `${sqlFunction.toLowerCase()}${sql}`;
      }
      return {
        sql,
        bindings: result.bindings,
      };
    }

    const formattedColumns = column.map((col) => {
      if (typeof col === "string") {
        const formatted = new InterpreterUtils(this.model).formatStringColumn(
          "mysql",
          col,
        );
        if (sqlFunction) {
          return `${sqlFunction.toLowerCase()}(${formatted})`;
        }
        return formatted;
      }

      const astParser = new AstParser(this.model, "mysql" as SqlDataSourceType);
      const result = astParser.parse([col]);
      let sql = `(${result.sql})`;
      if (sqlFunction) {
        sql = `${sqlFunction.toLowerCase()}${sql}`;
      }
      return sql;
    });

    return {
      sql: formattedColumns.join(", "),
      bindings: [],
    };
  }

  private formatAlias(alias?: string): string {
    if (alias && alias.length) {
      return ` as \`${alias}\``;
    }
    return "";
  }
}

export default new MysqlSelectInterpreter();
