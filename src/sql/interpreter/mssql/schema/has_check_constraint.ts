import { AstParser } from "../../../ast/parser";
import { HasCheckConstraintNode } from "../../../ast/query/node/schema/has_check_constraint";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MssqlHasCheckConstraintInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as HasCheckConstraintNode;
    const sql =
      `SELECT COUNT(*) as count ` +
      `FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc ` +
      `INNER JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc ` +
      `ON cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME ` +
      `WHERE tc.TABLE_NAME = '${node.table}' ` +
      `AND cc.CONSTRAINT_NAME = '${node.constraint}'`;
    return { sql, bindings: [] };
  }
}

export default new MssqlHasCheckConstraintInterpreter();
