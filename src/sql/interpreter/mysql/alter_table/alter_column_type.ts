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

    // Generate type change SQL
    let resultSql = `modify column \`${a.column}\` ${typeSql}`;

    // Add constraint modifications
    if (a.options.nullable !== undefined) {
      const nullableSql = a.options.nullable ? "" : " not null";
      resultSql += nullableSql;
    }

    if (a.options.dropDefault) {
      resultSql += " drop default";
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
      resultSql += ` default ${defaultValue}`;
    }

    if (a.options.unique !== undefined) {
      if (a.options.unique) {
        resultSql += " unique";
      }
      // MySQL doesn't support dropping unique constraint in modify column
      // It would need a separate ALTER TABLE statement
    }

    return { sql: resultSql, bindings: [] };
  }
}
export default new MysqlAlterColumnTypeInterpreter();
