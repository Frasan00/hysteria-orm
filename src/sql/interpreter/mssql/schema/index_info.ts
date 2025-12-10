import { AstParser } from "../../../ast/parser";
import { IndexInfoNode } from "../../../ast/query/node/schema/index_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MssqlIndexInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as IndexInfoNode;
    const table = node.table;
    const sql = `SELECT
  i.name as index_name,
  c.name as column_name,
  i.is_unique as is_unique
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('${table}')
  AND i.is_primary_key = 0
  AND i.type > 0`;
    return { sql, bindings: [] };
  }
}

export default new MssqlIndexInfoInterpreter();
