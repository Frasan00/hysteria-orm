import { AstParser } from "../../../ast/parser";
import { CreateTableNode } from "../../../ast/query/node/create_table";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class OracleCreateTableInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const ctNode = node as CreateTableNode;

    const utils = new InterpreterUtils(this.model);
    const tableName = utils.formatStringTable("oracledb", ctNode.table);

    if (!ctNode.children || !ctNode.children.length) {
      return { sql: `${tableName} ()`, bindings: [] };
    }

    const astParser = new AstParser(
      this.model,
      "oracledb" as SqlDataSourceType,
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

    const options: string[] = [];

    if (ctNode.oracleTablespace) {
      options.push(`TABLESPACE ${ctNode.oracleTablespace}`);
    }

    if (ctNode.oracleCompress) {
      options.push("COMPRESS");
    } else if (ctNode.oracleCompressFor) {
      options.push(`COMPRESS FOR ${ctNode.oracleCompressFor}`);
    }

    if (ctNode.oracleStorage) {
      const storageParts = Object.entries(ctNode.oracleStorage)
        .map(([key, value]) => `${key.toUpperCase()} ${value}`)
        .join(" ");
      if (storageParts) {
        options.push(`STORAGE (${storageParts})`);
      }
    }

    if (ctNode.oracleLogging === false) {
      options.push("NOLOGGING");
    } else if (ctNode.oracleLogging === true) {
      options.push("LOGGING");
    }

    if (ctNode.oracleCache === false) {
      options.push("NOCACHE");
    } else if (ctNode.oracleCache === true) {
      options.push("CACHE");
    }

    if (ctNode.oracleInMemory) {
      options.push("INMEMORY");
    }

    const optionsSql = options.length > 0 ? ` ${options.join(" ")}` : "";
    const finalSql = `${tableName} (${columnsSql})${optionsSql}`;
    return { sql: finalSql, bindings };
  }
}

export default new OracleCreateTableInterpreter();
