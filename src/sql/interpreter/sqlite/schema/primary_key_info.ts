import { AstParser } from "../../../ast/parser";
import { PrimaryKeyInfoNode } from "../../../ast/query/node/schema/primary_key_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class SqlitePrimaryKeyInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as PrimaryKeyInfoNode;
    const table = node.table;
    const sql = `SELECT
      'PRIMARY' as name,
      name as column_name
    FROM pragma_table_info('${table}')
    WHERE pk > 0
    ORDER BY pk`;
    return { sql, bindings: [] };
  }
}

export default new SqlitePrimaryKeyInfoInterpreter();
