import { AstParser } from "../../../ast/parser";
import { ForeignKeyInfoNode } from "../../../ast/query/node/schema/foreign_key_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MysqlForeignKeyInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as ForeignKeyInfoNode;
    const table = node.table;
    const sql = `SELECT
      CONSTRAINT_NAME AS name,
      COLUMN_NAME AS column_name,
      REFERENCED_TABLE_NAME AS referenced_table,
      REFERENCED_COLUMN_NAME AS referenced_column,
      UPDATE_RULE AS on_update,
      DELETE_RULE AS on_delete
    FROM information_schema.KEY_COLUMN_USAGE k
    JOIN information_schema.REFERENTIAL_CONSTRAINTS r
      ON k.CONSTRAINT_NAME = r.CONSTRAINT_NAME AND k.CONSTRAINT_SCHEMA = r.CONSTRAINT_SCHEMA
    WHERE k.TABLE_SCHEMA = DATABASE() AND k.TABLE_NAME = '${table}' AND k.REFERENCED_TABLE_NAME IS NOT NULL
    ORDER BY k.POSITION_IN_UNIQUE_CONSTRAINT`;
    return { sql, bindings: [] };
  }
}

export default new MysqlForeignKeyInfoInterpreter();
