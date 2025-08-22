import { AstParser } from "../../../ast/parser";
import { TableInfoNode } from "../../../ast/query/node/schema/table_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class PostgresTableInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as TableInfoNode;
    const table = node.table;
    const sql = `SELECT column_name,
       data_type,
       is_nullable,
       column_default,
       character_maximum_length AS char_length,
       numeric_precision AS numeric_precision,
       numeric_scale AS numeric_scale
FROM information_schema.columns
WHERE table_schema = current_schema()
  AND table_name = '${table}'
ORDER BY ordinal_position`;
    return { sql, bindings: [] };
  }
}

export default new PostgresTableInfoInterpreter();
