import { AstParser } from "../../../ast/parser";
import { PrimaryKeyInfoNode } from "../../../ast/query/node/schema/primary_key_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MysqlPrimaryKeyInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as PrimaryKeyInfoNode;
    const table = node.table;
    const sql = `SELECT
      CONSTRAINT_NAME AS name,
      COLUMN_NAME AS column_name
    FROM information_schema.KEY_COLUMN_USAGE k
    WHERE k.TABLE_SCHEMA = DATABASE() AND k.TABLE_NAME = '${table}' AND k.CONSTRAINT_NAME = 'PRIMARY'
    ORDER BY k.ORDINAL_POSITION`;
    return { sql, bindings: [] };
  }
}

export default new MysqlPrimaryKeyInfoInterpreter();
