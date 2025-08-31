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

    // Generate type change SQL
    let resultSql = `alter column "${a.column}" type ${typeSql}`;

    // Add constraint modifications
    if (a.options.nullable !== undefined) {
      const nullableSql = a.options.nullable
        ? `alter column "${a.column}" drop not null`
        : `alter column "${a.column}" set not null`;
      resultSql += `, ${nullableSql}`;
    }

    if (a.options.dropDefault) {
      resultSql += `, alter column "${a.column}" drop default`;
    } else if (a.options.default !== undefined) {
      let defaultValue = a.options.default;
      if (defaultValue === null) {
        defaultValue = "null";
      } else if (typeof defaultValue === "string") {
        if (defaultValue === "NULL") {
          defaultValue = "null";
        } else if (defaultValue === "TRUE" || defaultValue === "FALSE") {
          defaultValue = defaultValue.toLowerCase();
        } else {
          defaultValue = `'${defaultValue}'`;
        }
      }
      resultSql += `, alter column "${a.column}" set default ${defaultValue}`;
    }

    if (a.options.unique !== undefined) {
      if (a.options.unique) {
        resultSql += `, add constraint "unique_${a.column}" unique ("${a.column}")`;
      } else {
        resultSql += `, drop constraint "unique_${a.column}"`;
      }
    }

    return { sql: resultSql, bindings: [] };
  }
}
export default new PgAlterColumnTypeInterpreter();
