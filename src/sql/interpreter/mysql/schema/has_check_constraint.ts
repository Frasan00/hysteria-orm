import { AstParser } from "../../../ast/parser";
import { HasCheckConstraintNode } from "../../../ast/query/node/schema/has_check_constraint";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MysqlHasCheckConstraintInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as HasCheckConstraintNode;
    const sql =
      `SELECT COUNT(*) as count ` +
      `FROM information_schema.check_constraints ` +
      `WHERE constraint_schema = DATABASE() ` +
      `AND constraint_name = '${node.constraint}'`;
    return { sql, bindings: [] };
  }
}

export default new MysqlHasCheckConstraintInterpreter();
