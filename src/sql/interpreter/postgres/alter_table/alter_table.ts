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
      return { sql: "", bindings: [] };
    }

    const astParser = new AstParser(
      this.model,
      "postgres" as SqlDataSourceType,
    );
    const parts: string[] = [];
    const bindings: any[] = [];

    for (const child of atNode.children) {
      const { sql, bindings: childBindings } = astParser.parse([child]);
      parts.push(sql.trim());
      bindings.push(...childBindings);
    }

    const stmt = parts.join(", ");
    const ifExists = atNode.ifExists ? "if exists " : "";
    const finalSql = `${ifExists}${tableName} ${stmt}`;
    return { sql: finalSql, bindings };
  }
}

export default new PostgresAlterTableInterpreter();
