import { AstParser } from "../../../ast/parser";
import { UpdateNode } from "../../../ast/query/node/update";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class SqliteUpdateInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const updateNode = node as UpdateNode;

    if (updateNode.isRawValue) {
      return {
        sql: updateNode.table,
        bindings: updateNode.values,
      };
    }

    const interpreterUtils = new InterpreterUtils(this.model);
    const formattedTable = interpreterUtils.formatStringTable(
      "sqlite",
      updateNode.table,
    );

    if (!updateNode.columns.length || !updateNode.values.length) {
      return {
        sql: formattedTable,
        bindings: [],
      };
    }

    const setClause = updateNode.columns
      .map((column) => {
        return `${interpreterUtils.formatStringColumn("sqlite", column)} = ?`;
      })
      .join(", ");

    return {
      sql: `${formattedTable} SET ${setClause}`,
      bindings: updateNode.values,
    };
  }
}

export default new SqliteUpdateInterpreter();
