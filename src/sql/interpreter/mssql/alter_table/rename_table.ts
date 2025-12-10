import { RenameTableNode } from "../../../ast/query/node/alter_table/rename_table";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MssqlRenameTableInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const rt = node as RenameTableNode;
    return { sql: `[${rt.newName}]`, bindings: [] };
  }
}
export default new MssqlRenameTableInterpreter();
