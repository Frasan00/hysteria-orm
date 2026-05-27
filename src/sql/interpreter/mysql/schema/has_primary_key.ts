import { AstParser } from "../../../ast/parser";
import { HasPrimaryKeyNode } from "../../../ast/query/node/schema/has_primary_key";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MysqlHasPrimaryKeyInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as HasPrimaryKeyNode;
    const sql =
      `SELECT COUNT(*) as count ` +
      `FROM information_schema.table_constraints ` +
      `WHERE table_schema = DATABASE() ` +
      `AND table_name = '${node.table}' ` +
      `AND constraint_type = 'PRIMARY KEY'`;
    return { sql, bindings: [] };
  }
}

export default new MysqlHasPrimaryKeyInterpreter();
