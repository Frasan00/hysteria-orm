import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

/**
 * Oracle supports DROP PRIMARY KEY
 */
class OracleDropPrimaryKeyInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(_node: QueryNode) {
    return { sql: `drop primary key`, bindings: [] };
  }
}

export default new OracleDropPrimaryKeyInterpreter();
