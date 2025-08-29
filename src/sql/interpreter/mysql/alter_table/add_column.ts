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
    let { sql } = ast.parse([acNode.column]);

    const inlineConstraints = (acNode as any).inlineConstraints;
    if (inlineConstraints && inlineConstraints.length > 0) {
      const constraintParts: string[] = [];

      for (const constraint of inlineConstraints) {
        const { sql: constraintSql } = ast.parse([constraint]);
        constraintParts.push(constraintSql);
      }

      if (constraintParts.length > 0) {
        sql += ` ${constraintParts.join(" ")}`;
      }
    }

    return { sql: `add column ${sql}`, bindings: [] };
  }
}

export default new MysqlAddColumnInterpreter();
