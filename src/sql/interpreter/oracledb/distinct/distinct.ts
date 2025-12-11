import { AstParser } from "../../../ast/parser";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class OracleDistinctInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    // DISTINCT is handled by the parser directly
    return {
      sql: "",
      bindings: [],
    };
  }
}

export default new OracleDistinctInterpreter();
