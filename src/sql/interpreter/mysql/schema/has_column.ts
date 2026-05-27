import { AstParser } from "../../../ast/parser";
import { HasColumnNode } from "../../../ast/query/node/schema/has_column";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MysqlHasColumnInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as HasColumnNode;
    const sql =
      `SELECT COUNT(*) as count ` +
      `FROM information_schema.columns ` +
      `WHERE table_schema = DATABASE() ` +
      `AND table_name = '${node.table}' ` +
      `AND column_name = '${node.column}'`;
    return { sql, bindings: [] };
  }
}

export default new MysqlHasColumnInterpreter();
