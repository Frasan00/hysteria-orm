import { AstParser } from "../../../ast/parser";
import { ForeignKeyInfoNode } from "../../../ast/query/node/schema/foreign_key_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MssqlForeignKeyInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as ForeignKeyInfoNode;
    const table = node.table;
    const sql = `SELECT
  fk.name as name,
  c.name as column_name,
  rt.name as referenced_table,
  rc.name as referenced_column,
  fk.update_referential_action_desc as on_update,
  fk.delete_referential_action_desc as on_delete
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
INNER JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
INNER JOIN sys.tables rt ON fkc.referenced_object_id = rt.object_id
INNER JOIN sys.columns rc ON fkc.referenced_object_id = rc.object_id AND fkc.referenced_column_id = rc.column_id
WHERE fk.parent_object_id = OBJECT_ID('${table}')`;
    return { sql, bindings: [] };
  }
}

export default new MssqlForeignKeyInfoInterpreter();
