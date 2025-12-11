import { DropDefaultNode } from "../../../ast/query/node/alter_table/drop_default";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

/**
 * Oracle drops default by setting it to NULL
 */
class OracleDropDefaultInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const n = node as DropDefaultNode;
    return { sql: `modify "${n.column}" default null`, bindings: [] };
  }
}

export default new OracleDropDefaultInterpreter();
