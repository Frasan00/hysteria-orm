import { AstParser } from "../../../ast/parser";
import { HasPrimaryKeyNode } from "../../../ast/query/node/schema/has_primary_key";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class OracledbHasPrimaryKeyInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as HasPrimaryKeyNode;
    const sql =
      `SELECT COUNT(*) as count ` +
      `FROM ALL_CONSTRAINTS ` +
      `WHERE TABLE_NAME = UPPER('${node.table}') ` +
      `AND CONSTRAINT_TYPE = 'P'`;
    return { sql, bindings: [] };
  }
}

export default new OracledbHasPrimaryKeyInterpreter();
