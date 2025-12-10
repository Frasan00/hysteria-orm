import { DropPrimaryKeyNode } from "../../../ast/query/node/alter_table/drop_primary_key";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MssqlDropPrimaryKeyInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const pk = node as DropPrimaryKeyNode;
    const constraintName = `pk_${pk.table}`;
    return { sql: `drop constraint [${constraintName}]`, bindings: [] };
  }
}
export default new MssqlDropPrimaryKeyInterpreter();
