import { DropTableNode } from "../../../ast/query/node/drop_table/drop_table";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

/**
 * Oracle DROP TABLE syntax:
 * - DROP TABLE table_name [CASCADE CONSTRAINTS] [PURGE]
 * - Oracle doesn't support IF EXISTS directly, would need PL/SQL block
 */
class OracleDropTableInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const dt = node as DropTableNode;
    const utils = new InterpreterUtils(this.model);
    const tableSql = utils.formatStringTable("oracledb", dt.table);
    // Note: Oracle doesn't support IF EXISTS in standard SQL
    // The ifExists flag would require PL/SQL exception handling
    return { sql: `${tableSql} cascade constraints`, bindings: [] };
  }
}

export default new OracleDropTableInterpreter();
