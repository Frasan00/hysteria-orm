import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";

export class SqliteLockInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): { sql: string; bindings: any[] } {
    // SQLite does not support FOR UPDATE/SHARE in the same way as other DBs
    return {
      sql: "",
      bindings: [],
    };
  }
}

export default new SqliteLockInterpreter();
