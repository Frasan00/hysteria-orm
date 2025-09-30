import { AstParser } from "../../../ast/parser";
import { FromNode } from "../../../ast/query/node/from";
import { RawNode } from "../../../ast/query/node/raw/raw_node";
import { UpdateNode } from "../../../ast/query/node/update";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class PostgresUpdateInterpreter implements Interpreter {
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
      "postgres",
      updateNode.fromNode as FromNode,
    );

    if (!updateNode.columns.length || !updateNode.values.length) {
      return {
        sql: formattedTable,
        bindings: [],
      };
    }

    let rawNodeCount = 0;
    const finalBindings: any[] = [];
    const setClause = updateNode.columns
      .map((column, index) => {
        const idx = updateNode.currParamIndex + index - rawNodeCount;
        const value = updateNode.values[index];

        if (value instanceof RawNode) {
          rawNodeCount++;
          return `${interpreterUtils.formatStringColumn("postgres", column)} = ${value.rawValue}`;
        }

        finalBindings.push(value);
        return `${interpreterUtils.formatStringColumn("postgres", column)} = $${idx}${this.formatTypeCast(value)}`;
      })
      .join(", ");

    return {
      sql: `${formattedTable} set ${setClause}`,
      bindings: finalBindings,
    };
  }

  private formatTypeCast(value: any): string {
    let typeCast = "";
    if (Buffer.isBuffer(value)) {
      typeCast = "::bytea";
    } else if (Array.isArray(value)) {
      typeCast = "::array";
    } else if (
      typeof value === "object" &&
      value !== null &&
      !(value instanceof Date)
    ) {
      typeCast = "::jsonb";
    } else if (typeof value === "boolean") {
      typeCast = "::boolean";
    } else if (typeof value === "bigint") {
      typeCast = "::bigint";
    }

    return typeCast;
  }
}

export default new PostgresUpdateInterpreter();
