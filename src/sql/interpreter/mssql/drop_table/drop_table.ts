import { DropTableNode } from "../../../ast/query/node/drop_table/drop_table";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MssqlDropTableInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const dt = node as DropTableNode;
    const utils = new InterpreterUtils(this.model);
    const tableSql = utils.formatStringTable("mssql", dt.table);
    const exists = dt.ifExists ? "if exists " : "";
    return { sql: `${exists}${tableSql}`, bindings: [] };
  }
}
export default new MssqlDropTableInterpreter();
