import { AstParser } from "../../../ast/parser";
import { IndexInfoNode } from "../../../ast/query/node/schema/index_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

/**
 * Oracle uses USER_INDEXES and USER_IND_COLUMNS for index metadata
 */
class OracleIndexInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as IndexInfoNode;
    const table = node.table.toUpperCase();
    const sql = `SELECT
  i.index_name as index_name,
  ic.column_name as column_name,
  CASE WHEN i.uniqueness = 'UNIQUE' THEN 1 ELSE 0 END as is_unique
FROM user_indexes i
JOIN user_ind_columns ic ON i.index_name = ic.index_name
WHERE i.table_name = '${table}'
  AND i.index_name NOT LIKE 'SYS_%'
  AND NOT EXISTS (
    SELECT 1 FROM user_constraints c
    WHERE c.constraint_type = 'P'
      AND c.index_name = i.index_name
  )
ORDER BY i.index_name, ic.column_position`;
    return { sql, bindings: [] };
  }
}

export default new OracleIndexInfoInterpreter();
