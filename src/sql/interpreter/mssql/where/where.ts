import { AstParser } from "../../../ast/parser";
import { RawNode } from "../../../ast/query/node/raw/raw_node";
import { SqlFuncNode } from "../../../ast/query/node/sqlfunc/sqlfunc";
import type { WhereNode } from "../../../ast/query/node/where/where";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MssqlWhereInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const whereNode = node as WhereNode;
    if (whereNode.isRawValue) {
      const bindings = (whereNode.value as any[]) ?? [];
      if (bindings.length === 0) {
        return {
          sql: whereNode.column,
          bindings: [],
        };
      }

      let paramIndex = whereNode.currParamIndex;
      const sql = whereNode.column.replace(/\?/g, () => `@${paramIndex++}`);
      return {
        sql,
        bindings,
      };
    }

    const value = whereNode.value;
    const idx = whereNode.currParamIndex;

    // MSSQL has no ILIKE, so both sides are lowered instead
    const lowered = whereNode.operator.toLowerCase();
    const isIlike = lowered === "ilike" || lowered === "not ilike";
    const operator =
      lowered === "not ilike"
        ? "not like"
        : isIlike
          ? "like"
          : whereNode.operator;
    const lower = (fragment: string) =>
      isIlike ? `lower(${fragment})` : fragment;

    if (this.isRawNode(value)) {
      const formattedRight = this.formatRawIdentifierIfPossible(value.rawValue);
      const formattedColumn = new InterpreterUtils(
        this.model,
      ).formatStringColumn("mssql", whereNode.column);

      let sql =
        `${lower(formattedColumn)} ${operator} ${lower(formattedRight)}`.trim();

      if (whereNode.isNegated) {
        sql = `not (${sql})`;
      }

      return {
        sql,
        bindings: [],
      };
    }

    if (whereNode.tupleColumns?.length) {
      const utils = new InterpreterUtils(this.model);
      const columns = whereNode.tupleColumns.map((column) =>
        utils.formatStringColumn("mssql", column),
      );
      // SQL Server has no row constructors, so every tuple expands into an AND-ed group
      const tuples = value as any[][];
      let cursor = idx;
      const rows = tuples
        .map(
          () =>
            `(${columns
              .map((column) => `${column} = @${cursor++}`)
              .join(" and ")})`,
        )
        .join(" or ");

      return {
        sql: (whereNode.isNegated ? `not (${rows})` : rows).trim(),
        bindings: tuples.flat(),
      };
    }

    if (Array.isArray(value)) {
      const formattedColumn = new InterpreterUtils(
        this.model,
      ).formatStringColumn("mssql", whereNode.column);

      if (whereNode.operator.toLowerCase() === "between") {
        const placeholders = `@${idx} AND @${idx + 1}`;
        let sql = `${formattedColumn} between ${placeholders}`;

        if (whereNode.isNegated) {
          sql = `not (${sql})`;
        }

        return {
          sql: sql.trim(),
          bindings: value,
        };
      }

      const placeholders = value.map((_, i) => `@${idx + i}`).join(", ");

      let sql = `${formattedColumn} ${whereNode.operator} (${placeholders})`;

      if (whereNode.isNegated) {
        sql = `not (${sql})`;
      }

      return {
        sql: sql.trim(),
        bindings: value,
      };
    }

    if (value instanceof SqlFuncNode) {
      const rendered = new AstParser(this.model, "mssql").parse(
        [value],
        1,
        true,
      ).sql;
      const formattedColumn = new InterpreterUtils(
        this.model,
      ).formatStringColumn("mssql", whereNode.column);

      let sql = `${lower(formattedColumn)} ${operator} ${lower(rendered)}`;

      if (whereNode.isNegated) {
        sql = `not (${sql})`;
      }

      return {
        sql: sql.trim(),
        bindings: [],
      };
    }

    const formattedColumn = new InterpreterUtils(this.model).formatStringColumn(
      "mssql",
      whereNode.column,
    );

    if (whereNode.operator.includes("null")) {
      let sql = `${formattedColumn} ${whereNode.operator}`;

      if (whereNode.isNegated) {
        sql = `not (${sql})`;
      }

      return {
        sql: sql.trim(),
        bindings: [],
      };
    }

    if (value === undefined) {
      return {
        sql: "",
        bindings: [],
      };
    }

    let sql = `${lower(formattedColumn)} ${operator} ${isIlike ? `lower(@${idx})` : `@${idx}`}`;

    if (whereNode.isNegated) {
      sql = `not (${sql})`;
    }

    return {
      sql: sql.trim(),
      bindings: [value],
    };
  }

  private isRawNode(value: any): value is RawNode {
    if (!value) {
      return false;
    }

    const isObject = typeof value === "object";
    if (!isObject) {
      return false;
    }

    const hasRawValue = "rawValue" in value;
    const isMarkedRaw = (value as RawNode).isRawValue === true;

    return hasRawValue && isMarkedRaw;
  }

  private formatRawIdentifierIfPossible(raw: string): string {
    const isIdentifier =
      /^[A-Za-z_][A-Za-z0-9_]*(\.(\*|[A-Za-z_][A-Za-z0-9_]*))?$/.test(raw);
    if (!isIdentifier) {
      return raw;
    }

    return new InterpreterUtils(this.model).formatStringColumn("mssql", raw);
  }
}

export default new MssqlWhereInterpreter();
