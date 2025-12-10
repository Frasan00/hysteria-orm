import { AstParser } from "../../../ast/parser";
import type { JoinNode } from "../../../ast/query/node/join/join";
import type { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MssqlJoinInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const joinNode = node as JoinNode;
    if (joinNode.isRawValue) {
      return {
        sql: joinNode.table,
        bindings: [],
      };
    }

    const utils = new InterpreterUtils(this.model);

    let leftColumnStr = joinNode.left;
    if (!leftColumnStr.includes(".")) {
      leftColumnStr = `${joinNode.table}.${leftColumnStr}`;
    }

    let rightColumnStr = joinNode.right;
    if (!rightColumnStr.includes(".")) {
      rightColumnStr = `${this.model.table}.${rightColumnStr}`;
    }

    const leftSql = utils.formatStringColumn("mssql", leftColumnStr);
    const rightSql = utils.formatStringColumn("mssql", rightColumnStr);
    const tableSql = utils.formatStringTable("mssql", joinNode.table);

    const sql = `${tableSql} on ${leftSql} ${joinNode.on?.operator} ${rightSql}`;
    return { sql, bindings: [] };
  }
}

export default new MssqlJoinInterpreter();
