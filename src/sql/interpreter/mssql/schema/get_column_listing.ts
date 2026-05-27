import { AstParser } from "../../../ast/parser";
import { GetColumnListingNode } from "../../../ast/query/node/schema/get_column_listing";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MssqlGetColumnListingInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as GetColumnListingNode;
    const sql =
      `SELECT COLUMN_NAME as column_name ` +
      `FROM INFORMATION_SCHEMA.COLUMNS ` +
      `WHERE TABLE_NAME = '${node.table}' ` +
      `ORDER BY ORDINAL_POSITION`;
    return { sql, bindings: [] };
  }
}

export default new MssqlGetColumnListingInterpreter();
