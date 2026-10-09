import { AstParser } from "../../../ast/parser";
import { RawNode } from "../../../ast/query/node/raw/raw_node";
import { SqlFuncNode } from "../../../ast/query/node/sqlfunc/sqlfunc";
import type { WhereNode } from "../../../ast/query/node/where/where";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MysqlWhereInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const whereNode = node as WhereNode;
    if (whereNode.isRawValue) {
      return {
        sql: whereNode.column,
        bindings: (whereNode.value as any[]) ?? [],
      };
    }

    let sql = "";
    let bindings: any[] = [];

    // MySQL and MariaDB have no ILIKE, so both sides are lowered instead
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

    if (this.isRawNode(whereNode.value)) {
      const formattedRight = this.formatRawIdentifierIfPossible(
        whereNode.value.rawValue,
      );
      sql = `${lower(new InterpreterUtils(this.model).formatStringColumn("mysql", whereNode.column))} ${operator} ${lower(formattedRight)}`;
      bindings = [];
    } else if (whereNode.tupleColumns?.length) {
      const columns = whereNode.tupleColumns
        .map((column) =>
          new InterpreterUtils(this.model).formatStringColumn("mysql", column),
        )
        .join(", ");
      const tuples = whereNode.value as any[][];
      const rows = tuples
        .map((tuple) => `(${tuple.map(() => "?").join(", ")})`)
        .join(", ");
      sql = `(${columns}) ${whereNode.operator} (${rows})`;
      bindings = tuples.flat();
    } else if (Array.isArray(whereNode.value)) {
      if (whereNode.operator.toLowerCase() === "between") {
        const placeholders = `? AND ?`;
        sql = `${new InterpreterUtils(this.model).formatStringColumn("mysql", whereNode.column)} between ${placeholders}`;
        bindings = whereNode.value;
      } else {
        const placeholders = whereNode.value.map((_) => `?`).join(", ");
        sql = `${new InterpreterUtils(this.model).formatStringColumn("mysql", whereNode.column)} ${whereNode.operator} (${placeholders})`;
        bindings = whereNode.value;
      }
    } else if (whereNode.value instanceof SqlFuncNode) {
      const rendered = new AstParser(this.model, "mysql").parse(
        [whereNode.value],
        1,
        true,
      ).sql;
      sql = `${lower(new InterpreterUtils(this.model).formatStringColumn("mysql", whereNode.column))} ${operator} ${lower(rendered)}`;
      bindings = [];
    } else {
      if (whereNode.operator.includes("null")) {
        sql = `${new InterpreterUtils(this.model).formatStringColumn("mysql", whereNode.column)} ${whereNode.operator}`;
        bindings = [];
      } else if (whereNode.value === undefined) {
        return { sql: "", bindings: [] };
      } else {
        sql = `${lower(new InterpreterUtils(this.model).formatStringColumn("mysql", whereNode.column))} ${operator} ${isIlike ? "lower(?)" : "?"}`;
        bindings = [whereNode.value];
      }
    }

    if (whereNode.isNegated) {
      sql = `not (${sql})`;
    }

    return { sql: sql.trim(), bindings };
  }

  private isRawNode(value: any): value is RawNode {
    return (
      value &&
      typeof value === "object" &&
      "rawValue" in value &&
      value.isRawValue === true
    );
  }

  private formatRawIdentifierIfPossible(raw: string): string {
    const isIdentifier =
      /^[A-Za-z_][A-Za-z0-9_]*(\.(\*|[A-Za-z_][A-Za-z0-9_]*))?$/.test(raw);
    if (!isIdentifier) {
      return raw;
    }
    return new InterpreterUtils(this.model).formatStringColumn("mysql", raw);
  }
}

export default new MysqlWhereInterpreter();
