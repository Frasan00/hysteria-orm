import { AfterConstraintNode } from "../../../ast/query/node/constraint/after";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MysqlAfterConstraintInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const a = node as AfterConstraintNode;
    return { sql: `after \`${a.column}\``, bindings: [] };
  }
}
export default new MysqlAfterConstraintInterpreter();
