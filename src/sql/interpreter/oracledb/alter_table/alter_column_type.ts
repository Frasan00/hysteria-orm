import { AstParser } from "../../../ast/parser";
import { AlterColumnTypeNode } from "../../../ast/query/node/alter_table/alter_column_type";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";

/**
 * Oracle uses MODIFY column_name new_type syntax to change column type
 */
class OracleAlterColumnTypeInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const a = node as AlterColumnTypeNode;
    const ast = new AstParser(this.model, "oracledb" as SqlDataSourceType);
    const { sql } = ast.parse([a.newType]);
    const [, ...restTokens] = sql.trim().split(/\s+/);
    const typeSql = restTokens.join(" ");

    // Oracle uses MODIFY for column type changes
    let resultSql = `modify "${a.column}" ${typeSql}`;

    // Add constraint modifications
    if (a.options.nullable !== undefined) {
      const nullableSql = a.options.nullable
        ? `modify "${a.column}" null`
        : `modify "${a.column}" not null`;
      resultSql += `, ${nullableSql}`;
    }

    if (a.options.dropDefault) {
      resultSql += `, modify "${a.column}" default null`;
    } else if (a.options.default !== undefined) {
      let defaultValue = a.options.default;
      if (defaultValue === null) {
        defaultValue = "null";
      } else if (typeof defaultValue === "string") {
        if (defaultValue === "NULL") {
          defaultValue = "null";
        } else if (defaultValue === "TRUE") {
          defaultValue = "1";
        } else if (defaultValue === "FALSE") {
          defaultValue = "0";
        } else {
          defaultValue = `'${defaultValue}'`;
        }
      }
      resultSql += `, modify "${a.column}" default ${defaultValue}`;
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

export default new OracleAlterColumnTypeInterpreter();
