import { QueryNode } from "../../../ast/query/query";
import type { Interpreter } from "../../interpreter";
import { AstParser } from "../../../ast/parser";
import { Model } from "../../../models/model";

class MySqlDistinctInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    return {
      sql: "distinct",
      bindings: [],
    };
  }
}

export default new MySqlDistinctInterpreter();
