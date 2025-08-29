import { SetNotNullNode } from "../../../ast/query/node/alter_table/set_not_null";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class PostgresSetNotNullInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const n = node as SetNotNullNode;
    return { sql: `alter column "${n.column}" set not null`, bindings: [] };
  }
}
export default new PostgresSetNotNullInterpreter();
