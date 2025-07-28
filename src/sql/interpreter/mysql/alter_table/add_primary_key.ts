import { AddPrimaryKeyNode } from "../../../ast/query/node/alter_table/add_primary_key";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MysqlAddPrimaryKeyInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const pk = node as AddPrimaryKeyNode;
    const cols = pk.columns.map((c) => `\`${c}\``).join(", ");
    return { sql: `add primary key (${cols})`, bindings: [] };
  }
}
export default new MysqlAddPrimaryKeyInterpreter();
