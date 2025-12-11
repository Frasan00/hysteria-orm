import { AstParser } from "../../../ast/parser";
import { PrimaryKeyInfoNode } from "../../../ast/query/node/schema/primary_key_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

/**
 * Oracle uses USER_CONSTRAINTS and USER_CONS_COLUMNS for primary key metadata
 */
class OraclePrimaryKeyInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as PrimaryKeyInfoNode;
    const table = node.table.toUpperCase();
    const sql = `SELECT
  c.constraint_name as name,
  cc.column_name as column_name
FROM user_constraints c
JOIN user_cons_columns cc ON c.constraint_name = cc.constraint_name
WHERE c.constraint_type = 'P'
  AND c.table_name = '${table}'
ORDER BY cc.position`;
    return { sql, bindings: [] };
  }
}

export default new OraclePrimaryKeyInfoInterpreter();
