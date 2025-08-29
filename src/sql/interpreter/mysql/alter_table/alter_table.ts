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
      return { sql: "", bindings: [] };
    }

    const astParser = new AstParser(this.model, "mysql" as SqlDataSourceType);
    const parts: string[] = [];
    const bindings: any[] = [];

    for (const child of atNode.children) {
      const { sql, bindings: childBindings } = astParser.parse([child]);

      if (child.file === "add_column") {
        parts.push(sql);
      } else if (
        child.file === "add_constraint" ||
        child.folder === "constraint"
      ) {
        const last = parts[parts.length - 1] ?? "";
        const isExtendingAddColumn = /^\s*add\s+column\b/i.test(last);
        const isNamedTableConstraint = /^\s*add\s+constraint\b/i.test(sql);
        if (isExtendingAddColumn && !isNamedTableConstraint) {
          const cleaned = sql.replace(/^\s*add\s+/i, "").trimStart();
          parts[parts.length - 1] = `${last} ${cleaned}`;
        } else {
          const ensured = /^\s*add\b/i.test(sql) ? sql : `add ${sql}`;
          parts.push(ensured);
        }
      } else if (
        child.file === "set_default" ||
        child.file === "drop_default" ||
        child.file === "set_not_null" ||
        child.file === "drop_not_null"
      ) {
        parts.push(sql);
      } else {
        parts.push(sql);
      }

      bindings.push(...childBindings);
    }

    const stmt = parts.join(", ");
    const ifExists = atNode.ifExists ? "if exists " : "";
    const dropIndexPattern = /^\s*drop\s+index\b/i;
    const finalSql = dropIndexPattern.test(stmt)
      ? stmt
      : `${ifExists}${tableName} ${stmt}`;
    return { sql: finalSql, bindings };
  }
}

export default new MysqlAlterTableInterpreter();
