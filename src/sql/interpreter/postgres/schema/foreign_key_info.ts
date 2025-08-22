import { AstParser } from "../../../ast/parser";
import { ForeignKeyInfoNode } from "../../../ast/query/node/schema/foreign_key_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class PostgresForeignKeyInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as ForeignKeyInfoNode;
    const table = node.table;
    const sql = `SELECT
      tc.constraint_name as name,
      kcu.column_name as column_name,
      ccu.table_name as referenced_table,
      ccu.column_name as referenced_column,
      rc.update_rule as on_update,
      rc.delete_rule as on_delete
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name AND rc.constraint_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = current_schema() AND tc.table_name = '${table}'
    ORDER BY kcu.ordinal_position`;
    return { sql, bindings: [] };
  }
}

export default new PostgresForeignKeyInfoInterpreter();
