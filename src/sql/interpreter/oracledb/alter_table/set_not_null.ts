import { SetNotNullNode } from "../../../ast/query/node/alter_table/set_not_null";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

/**
 * Oracle uses MODIFY column NOT NULL syntax
 */
class OracleSetNotNullInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const n = node as SetNotNullNode;
    return { sql: `modify "${n.column}" not null`, bindings: [] };
  }
}

export default new OracleSetNotNullInterpreter();
