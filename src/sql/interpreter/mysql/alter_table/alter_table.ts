import { AstParser } from "../../../ast/parser";
import { AlterTableNode } from "../../../ast/query/node/alter_table";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MysqlAlterTableInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const atNode = node as AlterTableNode;
    const utils = new InterpreterUtils(this.model);
    const tableName = utils.formatStringTable("mysql", atNode.table);

    if (!atNode.children || !atNode.children.length) {
      return { sql: `${tableName}`, bindings: [] };
    }

    const astParser = new AstParser(this.model, "mysql" as SqlDataSourceType);
    const parts: string[] = [];
    const bindings: any[] = [];

    let awaitingConstraints = false;
    for (const child of atNode.children) {
      const { sql, bindings: childBindings } = astParser.parse([child]);

      if (child.file === "add_column") {
        parts.push(sql);
        awaitingConstraints = true;
      } else if (child.file === "add_constraint" && awaitingConstraints) {
        const last = parts.pop() ?? "";
        const cleanedSql = sql.replace(/^\s*add\s+/i, "").trimStart();
        parts.push(`${last} ${cleanedSql}`);
        // keep awaitingConstraints true for multiple constraints
      } else {
        parts.push(sql);
        awaitingConstraints = false;
      }

      bindings.push(...childBindings);
    }

    const stmt = parts.join(", ");
    const ifExists = atNode.ifExists ? "if exists " : "";
    const finalSql = `${ifExists}${tableName} ${stmt}`;
    return { sql: finalSql, bindings };
  }
}

export default new MysqlAlterTableInterpreter();
