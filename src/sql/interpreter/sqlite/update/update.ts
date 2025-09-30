import { AstParser } from "../../../ast/parser";
import { FromNode } from "../../../ast/query/node/from";
import { RawNode } from "../../../ast/query/node/raw/raw_node";
import { UpdateNode } from "../../../ast/query/node/update";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class SqliteUpdateInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const updateNode = node as UpdateNode;
    if (updateNode.isRawValue && typeof updateNode.fromNode === "string") {
      return {
        sql: updateNode.fromNode as string,
        bindings: updateNode.values,
      };
    }

    const interpreterUtils = new InterpreterUtils(this.model);
    const formattedTable = interpreterUtils.getFromForWriteOperations(
      "sqlite",
      updateNode.fromNode as FromNode,
    );

    if (!updateNode.columns.length || !updateNode.values.length) {
      return {
        sql: formattedTable,
        bindings: [],
      };
    }

    const finalBindings: any[] = [];
    const setClause = updateNode.columns
      .map((column, index) => {
        const value = updateNode.values[index];
        if (value instanceof RawNode) {
          return `${interpreterUtils.formatStringColumn("sqlite", column)} = ${value.rawValue}`;
        }

        finalBindings.push(value);
        return `${interpreterUtils.formatStringColumn("sqlite", column)} = ?`;
      })
      .join(", ");

    return {
      sql: `${formattedTable} set ${setClause}`,
      bindings: finalBindings,
    };
  }
}

export default new SqliteUpdateInterpreter();
