import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

/**
 * Oracle doesn't use AFTER constraint for column ordering in CREATE TABLE
 * This is a no-op interpreter
 */
class OracleAfterConstraintInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(_node: QueryNode) {
    return { sql: "", bindings: [] };
  }
}

export default new OracleAfterConstraintInterpreter();
