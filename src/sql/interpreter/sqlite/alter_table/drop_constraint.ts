import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class SqliteDropConstraintInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(_node: QueryNode) {
    return { sql: "", bindings: [] };
  }
}
export default new SqliteDropConstraintInterpreter();
