import { DropConstraintNode } from "../../../ast/query/node/alter_table/drop_constraint";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class SqliteDropConstraintInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const dc = node as DropConstraintNode;
    return { sql: `drop constraint "${dc.constraintName}"`, bindings: [] };
  }
}
export default new SqliteDropConstraintInterpreter();
