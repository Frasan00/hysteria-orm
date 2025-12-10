import { LockNode } from "../../../ast/query/node";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";

/**
 * MSSQL Lock Interpreter
 *
 * MSSQL uses table hints instead of FOR UPDATE/FOR SHARE:
 * - FOR UPDATE -> WITH (UPDLOCK)
 * - FOR SHARE -> WITH (HOLDLOCK)
 * - SKIP LOCKED -> WITH (READPAST)
 * - NOWAIT -> WITH (NOWAIT) or SET LOCK_TIMEOUT 0
 *
 * These hints are injected by the AST parser after the FROM clause table name,
 * so this interpreter returns empty SQL.
 */
class MssqlLockInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): { sql: string; bindings: any[] } {
    // Lock hints are handled by the AST parser and injected after FROM clause
    // See AstParser.getMssqlTableHints() for the implementation
    return {
      sql: "",
      bindings: [],
    };
  }
}

export default new MssqlLockInterpreter();
