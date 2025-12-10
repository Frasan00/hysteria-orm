import { AstParser } from "../../../ast/parser";
import { AddConstraintNode } from "../../../ast/query/node/alter_table/add_constraint";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";

class MssqlAddConstraintInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const acNode = node as AddConstraintNode;
    const ast = new AstParser(this.model, "mssql" as SqlDataSourceType);
    const { sql } = ast.parse([acNode.constraint]);
    return { sql: `add ${sql}`, bindings: [] };
  }
}
export default new MssqlAddConstraintInterpreter();
