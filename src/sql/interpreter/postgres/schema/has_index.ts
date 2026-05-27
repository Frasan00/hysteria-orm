import { AstParser } from "../../../ast/parser";
import { HasIndexNode } from "../../../ast/query/node/schema/has_index";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class PostgresHasIndexInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as HasIndexNode;
    const sql =
      `SELECT EXISTS (` +
      `SELECT FROM pg_indexes ` +
      `WHERE tablename = '${node.table}' ` +
      `AND indexname = '${node.index}'` +
      `) as exists`;
    return { sql, bindings: [] };
  }
}

export default new PostgresHasIndexInterpreter();
