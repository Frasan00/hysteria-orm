import { LockNode } from "../../../ast/query/node";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";

/**
 * Oracle locking syntax:
 * - FOR UPDATE: locks rows for update
 * - FOR UPDATE NOWAIT: fails immediately if row is locked
 * - FOR UPDATE SKIP LOCKED: skips locked rows (Oracle 11g+)
 * - FOR UPDATE WAIT n: waits n seconds before failing
 * Note: Oracle doesn't have FOR SHARE, FOR NO KEY UPDATE, or FOR KEY SHARE
 */
const lockTypeToSql: Record<string, string> = {
  for_update: "for update",
  for_share: "for update", // Oracle doesn't have FOR SHARE, use FOR UPDATE
  for_no_key_update: "for update",
  for_key_share: "for update",
};

export class OracleLockInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): { sql: string; bindings: any[] } {
    const lockNode = node as LockNode;
    let sql = lockTypeToSql[lockNode.lockType] || "for update";

    // Oracle uses SKIP LOCKED (11g+) and NOWAIT
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

export default new OracleLockInterpreter();
