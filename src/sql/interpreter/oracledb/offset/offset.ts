import { AstParser } from "../../../ast/parser";
import type { OffsetNode } from "../../../ast/query/node/offset/offset";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

/**
 * Oracle 12c+ uses OFFSET n ROWS syntax
 * This interpreter provides the value binding; the parser handles syntax
 */
class OracleOffsetInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const offsetNode = node as OffsetNode;

    return {
      sql: `:${offsetNode.currParamIndex}`,
      bindings: [offsetNode.offset],
    };
  }
}

export default new OracleOffsetInterpreter();
