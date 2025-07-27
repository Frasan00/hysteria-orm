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
        let inlineConstraintSql = sql;
        if (/foreign key/i.test(inlineConstraintSql)) {
          inlineConstraintSql = inlineConstraintSql.replace(
            /constraint\s+`[^`]+`\s*/i,
            "",
          );

          inlineConstraintSql = inlineConstraintSql.replace(
            /foreign key\s*\([^)]*\)\s*/i,
            "",
          );
        }

        if (/constraint\s+`[^`]+`\s+primary key/i.test(inlineConstraintSql)) {
          inlineConstraintSql = inlineConstraintSql.replace(
            /constraint\s+`[^`]+`\s+primary key\s*\([^)]*\)/i,
            "primary key",
          );
        } else if (/constraint\s+`[^`]+`\s+unique/i.test(inlineConstraintSql)) {
          inlineConstraintSql = inlineConstraintSql.replace(
            /constraint\s+`[^`]+`\s+unique\s*\([^)]*\)/i,
            "unique",
          );
        }

        let combined = `${last} ${inlineConstraintSql}`.trim();
        combined = combined.replace(
          /(references\s+`[^`]+`\s*\([^)]*\))\s+not null/i,
          "not null $1",
        );

        parts.push(combined);
      } else {
        parts.push(sql);
      }

      bindings.push(...childBindings);
    }

    const columnsSql = parts.join(", ");
    const ifNotExists = ctNode.ifNotExists ? "if not exists " : "";
    const finalSql = `${ifNotExists}${tableName} (${columnsSql})`;
    return { sql: finalSql, bindings };
  }
}

export default new MysqlCreateTableInterpreter();
