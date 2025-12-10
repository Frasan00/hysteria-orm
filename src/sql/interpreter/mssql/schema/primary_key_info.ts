import { AstParser } from "../../../ast/parser";
import { PrimaryKeyInfoNode } from "../../../ast/query/node/schema/primary_key_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MssqlPrimaryKeyInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as PrimaryKeyInfoNode;
    const table = node.table;
    const sql = `SELECT
  tc.CONSTRAINT_NAME as name,
  kcu.COLUMN_NAME as column_name
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
  ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
  AND tc.TABLE_NAME = '${table}'
ORDER BY kcu.ORDINAL_POSITION`;
    return { sql, bindings: [] };
  }
}

export default new MssqlPrimaryKeyInfoInterpreter();
