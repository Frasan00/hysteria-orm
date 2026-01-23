import { AstParser } from "../../../ast/parser";
import { CreateTableNode } from "../../../ast/query/node/create_table";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MysqlCreateTableInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const ctNode = node as CreateTableNode;
    const utils = new InterpreterUtils(this.model);
    const tableName = utils.formatStringTable("mysql", ctNode.table);

    if (!ctNode.children || !ctNode.children.length) {
      return { sql: `${tableName} ()`, bindings: [] };
    }

    const astParser = new AstParser(this.model, "mysql" as SqlDataSourceType);
    const parts: string[] = [];
    const bindings: any[] = [];

    for (const child of ctNode.children) {
      const { sql, bindings: childBindings } = astParser.parse([child]);

      if (child.folder === "constraint") {
        const last = parts.pop() ?? "";
        const inlineConstraintSql = sql;

        // Handle inline constraints: not null, null, and default
        if (
          /not null/i.test(inlineConstraintSql) ||
          /null/i.test(inlineConstraintSql) ||
          /default/i.test(inlineConstraintSql)
        ) {
          let combined = `${last} ${inlineConstraintSql}`.trim();
          combined = combined.replace(
            /(references\s+`[^`]+`\s*\([^)]*\))\s+not null/i,
            "not null $1",
          );
          parts.push(combined);
          bindings.push(...childBindings);
          continue;
        }

        parts.push(last);
        parts.push(inlineConstraintSql);
        bindings.push(...childBindings);
        continue;
      }

      parts.push(sql);
      bindings.push(...childBindings);
    }

    for (const constraint of ctNode.namedConstraints) {
      const { sql, bindings: constraintBindings } = astParser.parse([
        constraint,
      ]);

      parts.push(sql);
      bindings.push(...constraintBindings);
    }

    const columnsSql = parts.join(", ");
    const ifNotExists = ctNode.ifNotExists ? "if not exists " : "";

    const tableOptions: string[] = [];
    if (ctNode.engine) {
      tableOptions.push(`ENGINE=${ctNode.engine}`);
    }
    if (ctNode.charset) {
      tableOptions.push(`CHARSET=${ctNode.charset}`);
    }
    if (ctNode.collate) {
      tableOptions.push(`COLLATE=${ctNode.collate}`);
    }

    const tableOptionsSql =
      tableOptions.length > 0 ? ` ${tableOptions.join(" ")}` : "";

    const finalSql = `${ifNotExists}${tableName} (${columnsSql})${tableOptionsSql}`;
    return { sql: finalSql, bindings };
  }
}

export default new MysqlCreateTableInterpreter();
