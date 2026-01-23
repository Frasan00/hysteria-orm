import type { Interpreter } from "../../interpreter";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";

class SqliteSetTableOptionsInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): { sql: string; bindings: any[] } {
    return { sql: "", bindings: [] };
  }
}

export default new SqliteSetTableOptionsInterpreter();
