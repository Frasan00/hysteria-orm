import { AstParser } from "../../../ast/parser";
import { HasIndexNode } from "../../../ast/query/node/schema/has_index";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class OracledbHasIndexInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as HasIndexNode;
    const sql =
      `SELECT COUNT(*) as count ` +
      `FROM ALL_INDEXES ` +
      `WHERE TABLE_NAME = UPPER('${node.table}') ` +
      `AND INDEX_NAME = UPPER('${node.index}')`;
    return { sql, bindings: [] };
  }
}

export default new OracledbHasIndexInterpreter();
