import { AstParser } from "../../../ast/parser";
import { AlterColumnTypeNode } from "../../../ast/query/node/alter_table/alter_column_type";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";

class MssqlAlterColumnTypeInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const a = node as AlterColumnTypeNode;
    const ast = new AstParser(this.model, "mssql" as SqlDataSourceType);
    const { sql } = ast.parse([a.newType]);
    const [, ...restTokens] = sql.trim().split(/\s+/);
    const typeSql = restTokens.join(" ");

    let nullClause = "";
    if (a.options.nullable !== undefined) {
      nullClause = a.options.nullable ? " null" : " not null";
    }

    let resultSql = `alter column [${a.column}] ${typeSql}${nullClause}`;

    if (a.options.dropDefault) {
      resultSql = `drop constraint DF_${a.column}, ${resultSql}`;
    }

    if (a.options.default !== undefined && !a.options.dropDefault) {
      let defaultValue = a.options.default;
      if (defaultValue === null) {
        defaultValue = "null";
      } else if (typeof defaultValue === "string") {
        if (defaultValue === "NULL") {
          defaultValue = "null";
        } else if (defaultValue === "TRUE" || defaultValue === "FALSE") {
          defaultValue = defaultValue === "TRUE" ? "1" : "0";
        } else {
          defaultValue = `'${defaultValue}'`;
        }
      }
      resultSql += `, add constraint DF_${a.column} default ${defaultValue} for [${a.column}]`;
    }

    if (a.options.unique !== undefined) {
      if (a.options.unique) {
        resultSql += `, add constraint UQ_${a.column} unique ([${a.column}])`;
      }
    }

    return { sql: resultSql, bindings: [] };
  }
}
export default new MssqlAlterColumnTypeInterpreter();
