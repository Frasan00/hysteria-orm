import type { OffsetNode } from "../../../ast/query/node/offset/offset";
import { QueryNode } from "../../../ast/query/query";
import type { Interpreter } from "../../interpreter";
import { AstParser } from "../../../ast/parser";
import { Model } from "../../../models/model";

class MySqlOffsetInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const offsetNode = node as OffsetNode;

    return {
      sql: `${offsetNode.offset}`,
      bindings: [],
    };
  }
}

export default new MySqlOffsetInterpreter();
