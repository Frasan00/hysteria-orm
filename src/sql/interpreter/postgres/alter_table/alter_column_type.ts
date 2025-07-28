import { AstParser } from "../../../ast/parser";
import { AlterColumnTypeNode } from "../../../ast/query/node/alter_table/alter_column_type";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";

class PgAlterColumnTypeInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const a = node as AlterColumnTypeNode;
    const ast = new AstParser(this.model, "postgres" as SqlDataSourceType);
    const { sql } = ast.parse([a.newType]);
    const [, ...restTokens] = sql.trim().split(/\s+/);
    const typeSql = restTokens.join(" ");
    return { sql: `alter column "${a.column}" type ${typeSql}`, bindings: [] };
  }
}
export default new PgAlterColumnTypeInterpreter();
