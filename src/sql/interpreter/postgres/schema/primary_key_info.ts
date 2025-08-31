import { AstParser } from "../../../ast/parser";
import { PrimaryKeyInfoNode } from "../../../ast/query/node/schema/primary_key_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class PostgresPrimaryKeyInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as PrimaryKeyInfoNode;
    const table = node.table;
    const sql = `SELECT
      tc.constraint_name as name,
      kcu.column_name as column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = current_schema() AND tc.table_name = '${table}'
    ORDER BY kcu.ordinal_position`;
    return { sql, bindings: [] };
  }
}

export default new PostgresPrimaryKeyInfoInterpreter();
