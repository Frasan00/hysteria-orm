import { AstParser } from "../../../ast/parser";
import { HasColumnNode } from "../../../ast/query/node/schema/has_column";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class OracledbHasColumnInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as HasColumnNode;
    const sql =
      `SELECT COUNT(*) as count ` +
      `FROM ALL_TAB_COLUMNS ` +
      `WHERE TABLE_NAME = UPPER('${node.table}') ` +
      `AND COLUMN_NAME = UPPER('${node.column}')`;
    return { sql, bindings: [] };
  }
}

export default new OracledbHasColumnInterpreter();
