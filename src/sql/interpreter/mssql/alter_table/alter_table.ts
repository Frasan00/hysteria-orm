import { AstParser } from "../../../ast/parser";
import { AlterTableNode } from "../../../ast/query/node/alter_table";
import { RenameTableNode } from "../../../ast/query/node/alter_table/rename_table";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { SqlDataSourceType } from "../../../sql_data_source_types";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MssqlAlterTableInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const atNode = node as AlterTableNode;
    const utils = new InterpreterUtils(this.model);
    const tableName = utils.formatStringTable("mssql", atNode.table);

    if (!atNode.children || !atNode.children.length) {
      return { sql: "", bindings: [] };
    }

    // MSSQL uses sp_rename for table renaming
    if (
      atNode.children.length === 1 &&
      atNode.children[0] instanceof RenameTableNode
    ) {
      const renameNode = atNode.children[0] as RenameTableNode;
      return {
        sql: `EXEC sp_rename '${atNode.table}', '${renameNode.newName}'`,
        bindings: [],
      };
    }

    const astParser = new AstParser(this.model, "mssql" as SqlDataSourceType);
    const parts: string[] = [];
    const bindings: any[] = [];

    for (const child of atNode.children) {
      const { sql, bindings: childBindings } = astParser.parse([child]);
      parts.push(sql.trim());
      bindings.push(...childBindings);
    }

    const stmt = parts.join(", ");
    const finalSql = `${tableName} ${stmt}`;
    return { sql: finalSql, bindings };
  }
}

export default new MssqlAlterTableInterpreter();
