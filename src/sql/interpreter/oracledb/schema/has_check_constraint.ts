import { AstParser } from "../../../ast/parser";
import { HasCheckConstraintNode } from "../../../ast/query/node/schema/has_check_constraint";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class OracledbHasCheckConstraintInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as HasCheckConstraintNode;
    const sql =
      `SELECT COUNT(*) as count ` +
      `FROM ALL_CONSTRAINTS ` +
      `WHERE TABLE_NAME = UPPER('${node.table}') ` +
      `AND CONSTRAINT_NAME = UPPER('${node.constraint}') ` +
      `AND CONSTRAINT_TYPE = 'C'`;
    return { sql, bindings: [] };
  }
}

export default new OracledbHasCheckConstraintInterpreter();
