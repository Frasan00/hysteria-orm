import { AstParser } from "../../../ast/parser";
import type { LimitNode } from "../../../ast/query/node/limit/limit";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class SqliteLimitInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const limitNode = node as LimitNode;

    return {
      sql: `?`,
      bindings: [limitNode.limit],
    };
  }
}

export default new SqliteLimitInterpreter();
