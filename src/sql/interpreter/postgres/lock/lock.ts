import { LockNode } from "../../../ast/query/node";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";

const lockTypeToSql: Record<string, string> = {
  for_update: "for update",
  for_share: "for share",
  for_no_key_update: "for no key update",
  for_key_share: "for key share",
};

export class PostgresLockInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): { sql: string; bindings: any[] } {
    const lockNode = node as LockNode;
    let sql = lockTypeToSql[lockNode.lockType] || "for update";
    if (lockNode.skipLocked) {
      sql += " skip locked";
    }

    if (lockNode.noWait) {
      sql += " nowait";
    }
    return {
      sql,
      bindings: [],
    };
  }
}

export default new PostgresLockInterpreter();
