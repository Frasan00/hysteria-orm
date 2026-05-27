import { AstParser } from "../../../ast/parser";
import { HasIndexNode } from "../../../ast/query/node/schema/has_index";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MysqlHasIndexInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as HasIndexNode;
    const sql =
      `SELECT COUNT(*) as count ` +
      `FROM information_schema.statistics ` +
      `WHERE table_schema = DATABASE() ` +
      `AND table_name = '${node.table}' ` +
      `AND index_name = '${node.index}'`;
    return { sql, bindings: [] };
  }
}

export default new MysqlHasIndexInterpreter();
