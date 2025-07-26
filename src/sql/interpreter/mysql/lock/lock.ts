import { LockNode } from "../../../ast/query/node";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";

const lockTypeToSql: Record<string, string> = {
  for_update: "for update",
  for_share: "lock in share mode",
};

export class MysqlLockInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): { sql: string; bindings: any[] } {
    const lockNode = node as LockNode;
    let sql = lockTypeToSql[lockNode.lockType] || "for update";
    if (lockNode.skipLocked) {
      sql += " skip locked";
    }

    return {
      sql,
      bindings: [],
    };
  }
}

export default new MysqlLockInterpreter();
