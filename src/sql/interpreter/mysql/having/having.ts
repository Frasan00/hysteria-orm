import { AstParser } from "../../../ast/parser";
import { HavingNode } from "../../../ast/query/node/having/having";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MysqlHavingInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const havingNode = node as HavingNode;
    if (havingNode.isRawValue) {
      return {
        sql: havingNode.column,
        bindings: havingNode.value as any[],
      };
    }

    const idx = havingNode.currParamIndex;
    let sql = "";
    let bindings: any[] = [];

    if (
      !(havingNode.value instanceof QueryNode) &&
      !Array.isArray(havingNode.value)
    ) {
      sql = `${new InterpreterUtils(this.model).formatStringColumn("mysql", havingNode.column)} ${havingNode.operator} $${idx}`;
      bindings = [havingNode.value];
    }

    if (Array.isArray(havingNode.value)) {
      const placeholders = havingNode.value
        .map((_, i) => `$${idx + i}`)
        .join(", ");

      sql = `${new InterpreterUtils(this.model).formatStringColumn("mysql", havingNode.column)} ${havingNode.operator} (${placeholders})`;
      bindings = havingNode.value;
    }

    if (havingNode.isNegated) {
      sql = `not (${sql})`;
    }

    return { sql: sql.trim(), bindings };
  }
}

export default new MysqlHavingInterpreter();
