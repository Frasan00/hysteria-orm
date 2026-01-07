import { AstParser } from "../../../ast/parser";
import type { JoinNode } from "../../../ast/query/node/join/join";
import type { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class SqliteJoinInterpreter implements Interpreter {
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

    const leftSql = utils.formatStringColumn("sqlite", leftColumnStr);
    const rightSql = utils.formatStringColumn("sqlite", rightColumnStr);
    const tableSql = utils.formatStringTable("sqlite", joinNode.table);

    let sql = `${tableSql} on ${leftSql} ${joinNode.on?.operator} ${rightSql}`;
    let bindings: any[] = [];

    // Process additional conditions if present
    if (
      joinNode.additionalConditions &&
      joinNode.additionalConditions.length > 0
    ) {
      const parser = new AstParser(this.model, "sqlite");
      for (const condition of joinNode.additionalConditions) {
        const result = parser.parse([condition]);
        if (result.sql) {
          // Remove 'where ' or 'where' prefix from the SQL since we're in a join clause
          const conditionSql = result.sql.replace(/^where\s+/i, "");
          sql += ` and ${conditionSql}`;
          bindings.push(...result.bindings);
        }
      }
    }

    return { sql, bindings };
  }
}

export default new SqliteJoinInterpreter();
