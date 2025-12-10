import { AstParser } from "../../../ast/parser";
import { TableInfoNode } from "../../../ast/query/node/schema/table_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MssqlTableInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as TableInfoNode;
    const table = node.table;
    const sql = `SELECT
  c.COLUMN_NAME as column_name,
  c.DATA_TYPE as data_type,
  c.IS_NULLABLE as is_nullable,
  c.COLUMN_DEFAULT as column_default,
  c.CHARACTER_MAXIMUM_LENGTH as char_length,
  c.NUMERIC_PRECISION as numeric_precision,
  c.NUMERIC_SCALE as numeric_scale
FROM INFORMATION_SCHEMA.COLUMNS c
WHERE c.TABLE_NAME = '${table}'
ORDER BY c.ORDINAL_POSITION`;
    return { sql, bindings: [] };
  }
}

export default new MssqlTableInfoInterpreter();
