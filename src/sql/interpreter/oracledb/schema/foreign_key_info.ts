import { AstParser } from "../../../ast/parser";
import { ForeignKeyInfoNode } from "../../../ast/query/node/schema/foreign_key_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

/**
 * Oracle uses USER_CONSTRAINTS and USER_CONS_COLUMNS for foreign key metadata
 */
class OracleForeignKeyInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as ForeignKeyInfoNode;
    const table = node.table.toUpperCase();
    const sql = `SELECT
  c.constraint_name as name,
  cc.column_name as column_name,
  rc.table_name as referenced_table,
  rcc.column_name as referenced_column,
  c.delete_rule as on_delete
FROM user_constraints c
JOIN user_cons_columns cc ON c.constraint_name = cc.constraint_name
JOIN user_constraints rc ON c.r_constraint_name = rc.constraint_name
JOIN user_cons_columns rcc ON rc.constraint_name = rcc.constraint_name AND cc.position = rcc.position
WHERE c.constraint_type = 'R'
  AND c.table_name = '${table}'
ORDER BY cc.position`;
    return { sql, bindings: [] };
  }
}

export default new OracleForeignKeyInfoInterpreter();
