import { AstParser } from "../../../ast/parser";
import { GetTablesNode } from "../../../ast/query/node/schema/get_tables";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class SqliteGetTablesInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const sql = `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`;
    return { sql, bindings: [] };
  }
}

export default new SqliteGetTablesInterpreter();
