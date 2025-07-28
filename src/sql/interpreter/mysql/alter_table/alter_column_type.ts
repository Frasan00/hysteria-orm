import { AstParser } from "../../../ast/parser";
import { AlterColumnTypeNode } from "../../../ast/query/node/alter_table/alter_column_type";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";

class MysqlAlterColumnTypeInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const a = node as AlterColumnTypeNode;
    const ast = new AstParser(this.model, "mysql" as SqlDataSourceType);
    const { sql } = ast.parse([a.newType]);
    const [, ...rest] = sql.trim().split(/\s+/);
    const typeSql = rest.join(" ");
    return { sql: `modify column \`${a.column}\` ${typeSql}`, bindings: [] };
  }
}
export default new MysqlAlterColumnTypeInterpreter();
