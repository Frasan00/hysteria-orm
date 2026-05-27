import { AstParser } from "../../../ast/parser";
import { HasTableNode } from "../../../ast/query/node/schema/has_table";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class OracledbHasTableInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as HasTableNode;
    const table = node.table;
    const sql =
      `SELECT COUNT(*) as count ` +
      `FROM ALL_TABLES ` +
      `WHERE TABLE_NAME = UPPER('${table}')`;
    return { sql, bindings: [] };
  }
}

export default new OracledbHasTableInterpreter();
