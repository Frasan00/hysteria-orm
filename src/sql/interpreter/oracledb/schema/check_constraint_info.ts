import { AstParser } from "../../../ast/parser";
import { CheckConstraintInfoNode } from "../../../ast/query/node/schema/check_constraint_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class OracleCheckConstraintInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as CheckConstraintInfoNode;
    const table = node.table.toUpperCase();
    const sql = `SELECT
    constraint_name AS name,
    search_condition AS expression
  FROM user_constraints
  WHERE table_name = '${table}'
    AND constraint_type = 'C'
    AND constraint_name NOT LIKE 'SYS_%'`;
    return { sql, bindings: [] };
  }
}

export default new OracleCheckConstraintInfoInterpreter();
