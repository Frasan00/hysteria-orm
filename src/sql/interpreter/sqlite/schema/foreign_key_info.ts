import { AstParser } from "../../../ast/parser";
import { ForeignKeyInfoNode } from "../../../ast/query/node/schema/foreign_key_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class SqliteForeignKeyInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as ForeignKeyInfoNode;
    const table = node.table;
    const sql = `PRAGMA foreign_key_list(${table})`;
    return { sql, bindings: [] };
  }
}

export default new SqliteForeignKeyInfoInterpreter();
