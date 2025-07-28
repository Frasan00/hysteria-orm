import { AstParser } from "../../../ast/parser";
import type { GroupByNode } from "../../../ast/query/node/group_by/group_by";
import { QueryNode } from "../../../ast/query/query";
import type { Interpreter } from "../../interpreter";
import { Model } from "../../../models/model";
import { InterpreterUtils } from "../../interpreter_utils";

class SqliteGroupByInterpreter implements Interpreter {
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
      "sqlite",
      groupByNode.column,
    );

    return {
      sql: columnSql,
      bindings: [],
    };
  }
}

export default new SqliteGroupByInterpreter();
