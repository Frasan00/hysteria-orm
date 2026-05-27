import { AstParser } from "../../../ast/parser";
import { GetTablesNode } from "../../../ast/query/node/schema/get_tables";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class OracledbGetTablesInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const sql =
      `SELECT TABLE_NAME as table_name ` +
      `FROM ALL_TABLES ` +
      `WHERE OWNER = SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA') ` +
      `ORDER BY TABLE_NAME`;
    return { sql, bindings: [] };
  }
}

export default new OracledbGetTablesInterpreter();
