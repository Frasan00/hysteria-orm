import { AstParser } from "../../../ast/parser";
import { AddColumnNode } from "../../../ast/query/node/alter_table/add_column";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";

class MysqlAddColumnInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode) {
    const acNode = node as AddColumnNode;
    const ast = new AstParser(this.model, "mysql" as SqlDataSourceType);
    const { sql } = ast.parse([acNode.column]);
    return { sql: `add column ${sql}`, bindings: [] };
  }
}

export default new MysqlAddColumnInterpreter();
