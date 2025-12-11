import { AstParser } from "../../../ast/parser";
import type { LimitNode } from "../../../ast/query/node/limit/limit";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

/**
 * Oracle 12c+ uses FETCH FIRST n ROWS ONLY syntax for limit
 * This interpreter provides the value binding; the parser handles syntax
 */
class OracleLimitInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const limitNode = node as LimitNode;

    return {
      sql: `:${limitNode.currParamIndex}`,
      bindings: [limitNode.limit],
    };
  }
}

export default new OracleLimitInterpreter();
