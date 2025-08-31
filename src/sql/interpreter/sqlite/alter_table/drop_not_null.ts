import { DropNotNullNode } from "../../../ast/query/node/alter_table/drop_not_null";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class SqliteDropNotNullInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const n = node as DropNotNullNode;
    return { sql: `alter column "${n.column}" drop not null`, bindings: [] };
  }
}
export default new SqliteDropNotNullInterpreter();
