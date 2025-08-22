import { AstParser } from "../../../ast/parser";
import { IndexInfoNode } from "../../../ast/query/node/schema/index_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class PostgresIndexInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as IndexInfoNode;
    const table = node.table;
    const sql = `SELECT
    i.relname as index_name,
    a.attname as column_name,
    ix.indisunique as is_unique
  FROM
    pg_class t,
    pg_class i,
    pg_index ix,
    pg_attribute a,
    pg_namespace n
  WHERE
    t.oid = ix.indrelid
    AND i.oid = ix.indexrelid
    AND a.attrelid = t.oid
    AND a.attnum = ANY(ix.indkey)
    AND t.relkind = 'r'
    AND t.relname = '${table}'
    AND t.relnamespace = n.oid
    AND n.nspname = current_schema()
    AND i.relname NOT LIKE 'pk_%'`;
    return { sql, bindings: [] };
  }
}

export default new PostgresIndexInfoInterpreter();
