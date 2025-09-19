import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MysqlSetNotNullInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(_node: QueryNode) {
    // MySQL doesn't support standalone set not null operations
    return { sql: "", bindings: [] };
  }
}
export default new MysqlSetNotNullInterpreter();
