import { AstParser } from "../../../ast/parser";
import type { OffsetNode } from "../../../ast/query/node/offset/offset";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MssqlOffsetInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const offsetNode = node as OffsetNode;
    const idx = offsetNode.currParamIndex;

    return {
      sql: `offset @${idx} rows`,
      bindings: [offsetNode.offset],
    };
  }
}

export default new MssqlOffsetInterpreter();
