import { AstParser } from "../../../ast/parser";
import { TableInfoNode } from "../../../ast/query/node/schema/table_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class SqliteTableInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as TableInfoNode;
    const table = node.table;
    const sql = `PRAGMA table_info(${table})`;
    return { sql, bindings: [] };
  }
}

export default new SqliteTableInfoInterpreter();
