import { AstParser } from "../../../ast/parser";
import { HasCheckConstraintNode } from "../../../ast/query/node/schema/has_check_constraint";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class PostgresHasCheckConstraintInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as HasCheckConstraintNode;
    const sql =
      `SELECT EXISTS (` +
      `SELECT FROM information_schema.check_constraints cc ` +
      `INNER JOIN information_schema.table_constraints tc ` +
      `ON cc.constraint_name = tc.constraint_name ` +
      `WHERE tc.table_schema = current_schema() ` +
      `AND tc.table_name = '${node.table}' ` +
      `AND cc.constraint_name = '${node.constraint}'` +
      `) as exists`;
    return { sql, bindings: [] };
  }
}

export default new PostgresHasCheckConstraintInterpreter();
