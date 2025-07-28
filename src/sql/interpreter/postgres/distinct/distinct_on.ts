import { AstParser } from "../../../ast/parser";
import type { DistinctOnNode } from "../../../ast/query/node/distinct/distinct_on";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class PostgresDistinctOnInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const distinctOnNode = node as DistinctOnNode;
    const columns = distinctOnNode.columns
      .map((col) =>
        new InterpreterUtils(this.model).formatStringColumn("postgres", col),
      )
      .join(", ");
    return {
      sql: `(${columns})`,
      bindings: [],
    };
  }
}

export default new PostgresDistinctOnInterpreter();
