import { AstParser } from "../../../ast/parser";
import { HasPrimaryKeyNode } from "../../../ast/query/node/schema/has_primary_key";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class PostgresHasPrimaryKeyInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as HasPrimaryKeyNode;
    const sql =
      `SELECT EXISTS (` +
      `SELECT FROM information_schema.table_constraints ` +
      `WHERE table_schema = current_schema() ` +
      `AND table_name = '${node.table}' ` +
      `AND constraint_type = 'PRIMARY KEY'` +
      `) as exists`;
    return { sql, bindings: [] };
  }
}

export default new PostgresHasPrimaryKeyInterpreter();
