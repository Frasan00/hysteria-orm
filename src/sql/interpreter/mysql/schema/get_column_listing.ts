import { AstParser } from "../../../ast/parser";
import { GetColumnListingNode } from "../../../ast/query/node/schema/get_column_listing";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MysqlGetColumnListingInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as GetColumnListingNode;
    const sql =
      `SELECT column_name as name ` +
      `FROM information_schema.columns ` +
      `WHERE table_schema = DATABASE() ` +
      `AND table_name = '${node.table}' ` +
      `ORDER BY ordinal_position`;
    return { sql, bindings: [] };
  }
}

export default new MysqlGetColumnListingInterpreter();
