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
        const inlineConstraintSql = sql;

        if (
          /not null/i.test(inlineConstraintSql) ||
          /null/i.test(inlineConstraintSql) ||
          /default/i.test(inlineConstraintSql)
        ) {
          let combined = `${last} ${inlineConstraintSql}`.trim();
          combined = combined.replace(
            /(references\s+"[^"]+"\s*\([^)]*\))\s+not null/i,
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

    const tablePrefix: string[] = [];
    if (ctNode.temporary) {
      tablePrefix.push("TEMPORARY");
    }
    if (ctNode.unlogged) {
      tablePrefix.push("UNLOGGED");
    }

    const withOptions: string[] = [];
    if (ctNode.postgresWith) {
      const params = Object.entries(ctNode.postgresWith)
        .map(([key, value]) => {
          const val = typeof value === "boolean" ? value : value;
          return `${key}=${val}`;
        })
        .join(", ");
      if (params) {
        withOptions.push(`WITH (${params})`);
      }
    }

    const tablespaceClause = ctNode.tablespace
      ? `TABLESPACE ${ctNode.tablespace}`
      : "";

    const prefixSql = tablePrefix.length > 0 ? `${tablePrefix.join(" ")} ` : "";
    const withSql = withOptions.length > 0 ? ` ${withOptions.join(" ")}` : "";
    const tablespaceSql = tablespaceClause ? ` ${tablespaceClause}` : "";
    const finalSql = `${ifNotExists}${prefixSql}${tableName} (${columnsSql})${withSql}${tablespaceSql}`;
    return { sql: finalSql, bindings };
  }
}

export default new PostgresCreateTableInterpreter();
