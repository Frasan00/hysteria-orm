import { AstParser } from "../../../ast/parser";
import { HasIndexNode } from "../../../ast/query/node/schema/has_index";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MssqlHasIndexInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as HasIndexNode;
    const sql =
      `SELECT COUNT(*) as count ` +
      `FROM sys.indexes i ` +
      `INNER JOIN sys.tables t ON i.object_id = t.object_id ` +
      `WHERE t.name = '${node.table}' ` +
      `AND i.name = '${node.index}'`;
    return { sql, bindings: [] };
  }
}

export default new MssqlHasIndexInterpreter();
