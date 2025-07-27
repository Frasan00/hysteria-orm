import { RenameColumnNode } from "../../../ast/query/node/alter_table/rename_column";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class PgRenameColumnInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const r = node as RenameColumnNode;
    return {
      sql: `rename column "${r.oldName}" to "${r.newName}"`,
      bindings: [],
    };
  }
}
export default new PgRenameColumnInterpreter();
