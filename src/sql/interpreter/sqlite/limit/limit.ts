import { AstParser } from "../../../ast/parser";
import type { LimitNode } from "../../../ast/query/node/limit/limit";
import { QueryNode } from "../../../ast/query/query";
import type { Interpreter } from "../../interpreter";
import { Model } from "../../../models/model";

class SqliteLimitInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const limitNode = node as LimitNode;

    return {
      sql: `${limitNode.limit}`,
      bindings: [],
    };
  }
}

export default new SqliteLimitInterpreter();
