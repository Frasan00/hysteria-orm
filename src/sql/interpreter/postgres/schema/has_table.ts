import { AstParser } from "../../../ast/parser";
import { HasTableNode } from "../../../ast/query/node/schema/has_table";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class PostgresHasTableInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as HasTableNode;
    const table = node.table;
    const sql =
      `SELECT EXISTS (` +
      `SELECT FROM information_schema.tables ` +
      `WHERE table_schema = current_schema() ` +
      `AND table_name = '${table}'` +
      `) as exists`;
    return { sql, bindings: [] };
  }
}

export default new PostgresHasTableInterpreter();
