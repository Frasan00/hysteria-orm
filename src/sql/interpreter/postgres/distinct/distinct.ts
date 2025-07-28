import { AstParser } from "../../../ast/parser";
import { QueryNode } from "../../../ast/query/query";
import type { Interpreter } from "../../interpreter";
import { Model } from "../../../models/model";

class PostgresDistinctInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    return {
      sql: "",
      bindings: [],
    };
  }
}

export default new PostgresDistinctInterpreter();
