import { AstParser } from "../../../ast/parser";
import { IndexInfoNode } from "../../../ast/query/node/schema/index_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class SqliteIndexInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as IndexInfoNode;
    const table = node.table;
    const sql = `PRAGMA index_list(${table})`;
    return { sql, bindings: [] };
  }
}

export default new SqliteIndexInfoInterpreter();
