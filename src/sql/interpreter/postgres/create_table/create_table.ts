import { AstParser } from "../../../ast/parser";
import { CreateTableNode } from "../../../ast/query/node/create_table";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class PostgresCreateTableInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const ctNode = node as CreateTableNode;

    const utils = new InterpreterUtils(this.model);
    const tableName = utils.formatStringTable("postgres", ctNode.table);

    if (!ctNode.children || !ctNode.children.length) {
      return { sql: `${tableName} ()`, bindings: [] };
    }

    const astParser = new AstParser(
      this.model,
      "postgres" as SqlDataSourceType,
    );

    const parts: string[] = [];
    const bindings: any[] = [];

    for (const child of ctNode.children) {
      const { sql, bindings: childBindings } = astParser.parse([child]);
      if (child.folder === "constraint") {
        const last = parts.pop() ?? "";

        let inlineConstraintSql = sql;
        if (/\bforeign key\b/i.test(inlineConstraintSql)) {
          inlineConstraintSql = inlineConstraintSql.replace(
            /foreign key\s*\([^)]*\)\s*/i,
            "",
          );
        }

        parts.push(`${last} ${inlineConstraintSql}`.trim());
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

export default new PostgresCreateTableInterpreter();
