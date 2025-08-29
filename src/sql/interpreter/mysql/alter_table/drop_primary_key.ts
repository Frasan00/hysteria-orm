import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MysqlDropPrimaryKeyInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(_node: QueryNode) {
    return { sql: `drop primary key`, bindings: [] };
  }
}
export default new MysqlDropPrimaryKeyInterpreter();
