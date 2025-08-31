import { AstParser } from "../../../ast/parser";
import { AlterTableNode } from "../../../ast/query/node/alter_table";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class SqliteAlterTableInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const atNode = node as AlterTableNode;
    const utils = new InterpreterUtils(this.model);
    const tableName = utils.formatStringTable("sqlite", atNode.table);

    if (!atNode.children || !atNode.children.length) {
      return { sql: "", bindings: [] };
    }

    const astParser = new AstParser(this.model, "sqlite" as SqlDataSourceType);
    const parts: string[] = [];
    const bindings: any[] = [];

    let awaitingConstraints = false;
    for (const child of atNode.children) {
      const { sql, bindings: childBindings } = astParser.parse([child]);
      if (!sql || !sql.trim()) {
        continue;
      }

      if (child.file === "add_column") {
        parts.push(sql);
        awaitingConstraints = true;
      } else if (child.file === "add_constraint" && awaitingConstraints) {
        const last = parts.pop() ?? "";
        const cleanedSql = sql.replace(/^\s*add\s+/i, "").trimStart();
        parts.push(`${last} ${cleanedSql}`);
      } else if (
        child.file === "set_not_null" ||
        child.file === "drop_not_null"
      ) {
        // SQLite doesn't support these operations, skip them
        continue;
      } else if (
        child.file === "set_default" ||
        child.file === "drop_default"
      ) {
        // SQLite doesn't support these operations, skip them
        continue;
      } else {
        parts.push(sql);
        awaitingConstraints = false;
      }

      bindings.push(...childBindings);
    }

    const stmt = parts.join(", ");
    const ifExists = atNode.ifExists ? "if exists " : "";

    if (!stmt.trim()) {
      return { sql: "", bindings: [] };
    }

    const finalSql = `${ifExists}${tableName} ${stmt}`;
    return { sql: finalSql, bindings };
  }
}

export default new SqliteAlterTableInterpreter();
