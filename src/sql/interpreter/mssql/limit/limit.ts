import { AstParser } from "../../../ast/parser";
import type { LimitNode } from "../../../ast/query/node/limit/limit";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MssqlLimitInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const limitNode = node as LimitNode;
    const idx = limitNode.currParamIndex;

    return {
      sql: `fetch next @${idx} rows only`,
      bindings: [limitNode.limit],
    };
  }
}

export default new MssqlLimitInterpreter();
