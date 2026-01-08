import { AstParser } from "../../../ast/parser";
import type { SelectNode } from "../../../ast/query/node/select/basic_select";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class PostgresSelectInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const selectNode = node as SelectNode;
    if (selectNode.isRawValue) {
      return {
        sql: this.quoteAliasesInRawSql(selectNode.column as string),
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
        "postgres",
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
      const astParser = new AstParser(
        this.model,
        "postgres" as SqlDataSourceType,
      );
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
      const astParser = new AstParser(
        this.model,
        "postgres" as SqlDataSourceType,
      );
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
          "postgres",
          col,
        );
        if (sqlFunction) {
          return `${sqlFunction.toLowerCase()}(${formatted})`;
        }
        return formatted;
      }

      const astParser = new AstParser(
        this.model,
        "postgres" as SqlDataSourceType,
      );
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
    if (alias && alias.length > 0) {
      return ` as "${alias}"`;
    }
    return "";
  }

  /**
   * Quotes unquoted aliases in raw SQL to preserve identifier case.
   *
   * PostgreSQL converts unquoted identifiers to lowercase by default.
   * This method ensures aliases in SELECT statements are quoted to preserve
   * camelCase or other mixed-case naming.
   *
   * @example
   * Input:  "max(age) as maxAge"
   * Output: "max(age) as \"maxAge\""
   *
   * @example CAST expressions are handled specially
   * Input:  "CAST(x AS int) as result"
   * Output: "CAST(x AS int) as \"result\""
   *
   * The type after AS inside CAST() is NOT quoted since it's part of SQL
   * syntax, not an alias. This is detected by checking if there's an unclosed
   * CAST( parenthesis before the AS keyword.
   */
  private quoteAliasesInRawSql(sql: string): string {
    return sql.replace(
      /\bas\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/gi,
      (match, alias, offset) => {
        const before = sql.slice(0, offset);
        const lowerBefore = before.toLowerCase();
        let lastCastPos = lowerBefore.lastIndexOf("cast");

        while (lastCastPos >= 0) {
          const charBefore =
            lastCastPos > 0 ? lowerBefore[lastCastPos - 1] : " ";
          const charAfter = lowerBefore[lastCastPos + 4] || " ";

          if (!/[a-z0-9_]/i.test(charBefore) && !/[a-z0-9_]/i.test(charAfter)) {
            break;
          }
          lastCastPos = lowerBefore.lastIndexOf("cast", lastCastPos - 1);
        }

        if (lastCastPos >= 0) {
          // Count parentheses from CAST position to current position
          const segment = before.slice(lastCastPos);
          let depth = 0;
          for (const char of segment) {
            if (char === "(") {
              depth++;
            }
            if (char === ")") {
              depth--;
            }
          }

          // depth > 0 means we're inside an unclosed CAST() - don't quote the type
          if (depth > 0) {
            return match;
          }
        }

        return `as "${alias}"`;
      },
    );
  }
}

export default new PostgresSelectInterpreter();
