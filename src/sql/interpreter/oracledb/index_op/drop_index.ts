import { DropIndexNode } from "../../../ast/query/node/index_op/drop_index";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

/**
 * Oracle DROP INDEX syntax:
 * DROP INDEX index_name
 * Note: Oracle doesn't support CASCADE for DROP INDEX
 */
class OracleDropIndexInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const di = node as DropIndexNode;
    return {
      sql: `"${di.indexName}"`,
      bindings: [],
    };
  }
}

export default new OracleDropIndexInterpreter();
