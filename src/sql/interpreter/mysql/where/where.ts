import { AstParser } from "../../../ast/parser";
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

    const idx = whereNode.currParamIndex;
    let sql = "";
    let bindings: any[] = [];

    if (
      !(whereNode.value instanceof QueryNode) &&
      !Array.isArray(whereNode.value)
    ) {
      if (whereNode.operator.includes("null")) {
        sql = `${new InterpreterUtils(this.model).formatStringColumn("mysql", whereNode.column)} ${whereNode.operator}`;
        bindings = [];
      } else if (whereNode.value === undefined) {
        return { sql: "", bindings: [] };
      } else {
        sql = `${new InterpreterUtils(this.model).formatStringColumn("mysql", whereNode.column)} ${whereNode.operator} ?`;
        bindings = [whereNode.value];
      }
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
    }

    if (whereNode.isNegated) {
      sql = `not (${sql})`;
    }

    return { sql: sql.trim(), bindings };
  }
}

export default new MysqlWhereInterpreter();
