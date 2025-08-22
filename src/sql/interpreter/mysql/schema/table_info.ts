import { AstParser } from "../../../ast/parser";
import { TableInfoNode } from "../../../ast/query/node/schema/table_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MysqlTableInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as TableInfoNode;
    const table = node.table;
    const sql =
      `SELECT COLUMN_NAME AS column_name, ` +
      `DATA_TYPE AS data_type, ` +
      `IS_NULLABLE AS is_nullable, ` +
      `COLUMN_DEFAULT AS column_default, ` +
      `CHARACTER_MAXIMUM_LENGTH AS char_length, ` +
      `NUMERIC_PRECISION AS numeric_precision, ` +
      `NUMERIC_SCALE AS numeric_scale ` +
      `FROM information_schema.columns ` +
      `WHERE table_schema = DATABASE() AND table_name = '${table}' ` +
      `ORDER BY ORDINAL_POSITION`;
    return { sql, bindings: [] };
  }
}

export default new MysqlTableInfoInterpreter();
