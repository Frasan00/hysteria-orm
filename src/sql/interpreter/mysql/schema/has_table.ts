import { AstParser } from "../../../ast/parser";
import { HasTableNode } from "../../../ast/query/node/schema/has_table";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MysqlHasTableInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as HasTableNode;
    const table = node.table;
    const sql =
      `SELECT COUNT(*) as count ` +
      `FROM information_schema.tables ` +
      `WHERE table_schema = DATABASE() ` +
      `AND table_name = '${table}'`;
    return { sql, bindings: [] };
  }
}

export default new MysqlHasTableInterpreter();
