import { AstParser } from "../../../ast/parser";
import { AlterTableNode } from "../../../ast/query/node/alter_table";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class PostgresAlterTableInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const atNode = node as AlterTableNode;
    const utils = new InterpreterUtils(this.model);
    const tableName = utils.formatStringTable("postgres", atNode.table);

    if (!atNode.children || !atNode.children.length) {
      return { sql: `${tableName}`, bindings: [] };
    }

    const astParser = new AstParser(
      this.model,
      "postgres" as SqlDataSourceType,
    );
    const parts: string[] = [];
    const bindings: any[] = [];

    let awaitingConstraints = false;
    for (const child of atNode.children) {
      const { sql, bindings: childBindings } = astParser.parse([child]);

      if (child.file === "add_column") {
        // Start a new add column clause and allow following constraints to merge.
        parts.push(sql);
        awaitingConstraints = true;
      } else if (child.file === "add_constraint" && awaitingConstraints) {
        // Merge constraint into the previously added column definition, stripping the leading "add" keyword.
        const last = parts.pop() ?? "";
        // Remove leading spaces and the first "add" keyword (with any subsequent whitespace)
        const cleanedSql = sql.replace(/^\s*add\s+/i, "").trimStart();
        parts.push(`${last} ${cleanedSql}`);
        // Keep awaitingConstraints = true to merge additional consecutive constraints.
      } else {
        // Any other node finishes the add column merging context.
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

export default new PostgresAlterTableInterpreter();
