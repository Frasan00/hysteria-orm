import { DropDefaultNode } from "../../../ast/query/node/alter_table/drop_default";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MysqlDropDefaultInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const n = node as DropDefaultNode;
    return { sql: `alter column \`${n.column}\` drop default`, bindings: [] };
  }
}
export default new MysqlDropDefaultInterpreter();
