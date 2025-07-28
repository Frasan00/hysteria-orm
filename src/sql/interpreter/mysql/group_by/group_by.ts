import type { GroupByNode } from "../../../ast/query/node/group_by/group_by";
import { QueryNode } from "../../../ast/query/query";
import type { Interpreter } from "../../interpreter";
import { AstParser } from "../../../ast/parser";
import { Model } from "../../../models/model";
import { InterpreterUtils } from "../../interpreter_utils";

class MySqlGroupByInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const groupByNode = node as GroupByNode;
    if (groupByNode.isRawValue) {
      return {
        sql: groupByNode.column,
        bindings: [],
      };
    }

    const columnSql = new InterpreterUtils(this.model).formatStringColumn(
      "mysql",
      groupByNode.column,
    );

    return {
      sql: columnSql,
      bindings: [],
    };
  }
}

export default new MySqlGroupByInterpreter();
