import { AstParser } from "../../../ast/parser";
import { HasTableNode } from "../../../ast/query/node/schema/has_table";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MssqlHasTableInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as HasTableNode;
    const table = node.table;
    const sql =
      `SELECT COUNT(*) as count ` +
      `FROM INFORMATION_SCHEMA.TABLES ` +
      `WHERE TABLE_TYPE = 'BASE TABLE' ` +
      `AND TABLE_NAME = '${table}'`;
    return { sql, bindings: [] };
  }
}

export default new MssqlHasTableInterpreter();
