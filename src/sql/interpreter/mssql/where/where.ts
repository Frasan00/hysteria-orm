import { AstParser } from "../../../ast/parser";
import { RawNode } from "../../../ast/query/node/raw/raw_node";
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
      return {
        sql: whereNode.column,
        bindings: (whereNode.value as any[]) ?? [],
      };
    }

    const value = whereNode.value;
    const idx = whereNode.currParamIndex;

    if (this.isRawNode(value)) {
      const formattedRight = this.formatRawIdentifierIfPossible(value.rawValue);
      const formattedColumn = new InterpreterUtils(
        this.model,
      ).formatStringColumn("mssql", whereNode.column);

      return {
        sql: `${formattedColumn} ${whereNode.operator} ${formattedRight}`.trim(),
        bindings: [],
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

    let sql = `${formattedColumn} ${whereNode.operator} @${idx}`;

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
