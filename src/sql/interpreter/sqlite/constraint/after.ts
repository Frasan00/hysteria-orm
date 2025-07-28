import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class SqliteAfterConstraintInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    return { sql: "", bindings: [] };
  }
}
export default new SqliteAfterConstraintInterpreter();
