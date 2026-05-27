import { AstParser } from "../../../ast/parser";
import { HasColumnNode } from "../../../ast/query/node/schema/has_column";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class PostgresHasColumnInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as HasColumnNode;
    const sql =
      `SELECT EXISTS (` +
      `SELECT FROM information_schema.columns ` +
      `WHERE table_schema = current_schema() ` +
      `AND table_name = '${node.table}' ` +
      `AND column_name = '${node.column}'` +
      `) as exists`;
    return { sql, bindings: [] };
  }
}

export default new PostgresHasColumnInterpreter();
