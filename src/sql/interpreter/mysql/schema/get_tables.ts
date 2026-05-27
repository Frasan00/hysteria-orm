import { AstParser } from "../../../ast/parser";
import { GetTablesNode } from "../../../ast/query/node/schema/get_tables";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MysqlGetTablesInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const sql =
      `SELECT table_name as name ` +
      `FROM information_schema.tables ` +
      `WHERE table_schema = DATABASE() ` +
      `AND table_type = 'BASE TABLE' ` +
      `ORDER BY table_name`;
    return { sql, bindings: [] };
  }
}

export default new MysqlGetTablesInterpreter();
