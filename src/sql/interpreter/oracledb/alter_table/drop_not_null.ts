import { DropNotNullNode } from "../../../ast/query/node/alter_table/drop_not_null";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

/**
 * Oracle uses MODIFY column NULL syntax to drop NOT NULL constraint
 */
class OracleDropNotNullInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const n = node as DropNotNullNode;
    return { sql: `modify "${n.column}" null`, bindings: [] };
  }
}

export default new OracleDropNotNullInterpreter();
