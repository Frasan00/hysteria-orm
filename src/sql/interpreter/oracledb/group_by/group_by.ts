import { AstParser } from "../../../ast/parser";
import type { GroupByNode } from "../../../ast/query/node/group_by/group_by";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class OracleGroupByInterpreter implements Interpreter {
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
      "oracledb",
      groupByNode.column,
    );

    return {
      sql: columnSql,
      bindings: [],
    };
  }
}

export default new OracleGroupByInterpreter();
