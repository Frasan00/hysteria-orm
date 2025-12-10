import { RenameColumnNode } from "../../../ast/query/node/alter_table/rename_column";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MssqlRenameColumnInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const r = node as RenameColumnNode;
    const table = this.model?.table ?? "";
    return {
      sql: `sp_rename '${table}.${r.oldName}', '${r.newName}', 'COLUMN'`,
      bindings: [],
    };
  }
}
export default new MssqlRenameColumnInterpreter();
