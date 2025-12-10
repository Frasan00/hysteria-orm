import { DropIndexNode } from "../../../ast/query/node/index_op/drop_index";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MssqlDropIndexInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const di = node as DropIndexNode;
    return {
      sql: `[${di.indexName}] on [${di.table}]`,
      bindings: [],
    };
  }
}
export default new MssqlDropIndexInterpreter();
