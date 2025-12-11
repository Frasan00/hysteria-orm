import { AstParser } from "../../../ast/parser";
import { TableInfoNode } from "../../../ast/query/node/schema/table_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

/**
 * Oracle uses USER_TAB_COLUMNS or ALL_TAB_COLUMNS for column metadata
 */
class OracleTableInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as TableInfoNode;
    const table = node.table.toUpperCase();
    const sql = `SELECT
  column_name,
  data_type,
  CASE WHEN nullable = 'Y' THEN 'YES' ELSE 'NO' END as is_nullable,
  data_default as column_default,
  char_length as char_length,
  data_precision as numeric_precision,
  data_scale as numeric_scale
FROM user_tab_columns
WHERE table_name = '${table}'
ORDER BY column_id`;
    return { sql, bindings: [] };
  }
}

export default new OracleTableInfoInterpreter();
