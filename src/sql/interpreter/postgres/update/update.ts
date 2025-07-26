import { AstParser } from "../../../ast/parser";
import { UpdateNode } from "../../../ast/query/node/update";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class PostgresUpdateInterpreter implements Interpreter {
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
      "postgres",
      updateNode.table,
    );

    if (!updateNode.columns.length || !updateNode.values.length) {
      return {
        sql: formattedTable,
        bindings: [],
      };
    }

    const setClause = updateNode.columns
      .map((column, index) => {
        const idx = updateNode.currParamIndex + index;
        const value = updateNode.values[index];

        return `${interpreterUtils.formatStringColumn("postgres", column)} = $${idx}${this.formatTypeCast(value)}`;
      })
      .join(", ");

    return {
      sql: `${formattedTable} SET ${setClause}`,
      bindings: updateNode.values,
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
