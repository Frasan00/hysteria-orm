import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MysqlDropNotNullInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(_node: QueryNode) {
    // MySQL doesn't support standalone drop not null operations
    return { sql: "", bindings: [] };
  }
}
export default new MysqlDropNotNullInterpreter();
