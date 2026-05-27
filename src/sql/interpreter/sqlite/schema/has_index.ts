import { AstParser } from "../../../ast/parser";
import { HasIndexNode } from "../../../ast/query/node/schema/has_index";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class SqliteHasIndexInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as HasIndexNode;
    const sql = `SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='${node.table}' AND name='${node.index}'`;
    return { sql, bindings: [] };
  }
}

export default new SqliteHasIndexInterpreter();
