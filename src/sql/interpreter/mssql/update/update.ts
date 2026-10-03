import { AstParser } from "../../../ast/parser";
import { FromNode } from "../../../ast/query/node/from";
import { RawNode } from "../../../ast/query/node/raw/raw_node";
import { UpdateNode } from "../../../ast/query/node/update";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { SqlDataSourceType } from "../../../sql_data_source_types";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MssqlUpdateInterpreter implements Interpreter {
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
      "mssql",
      updateNode.fromNode as FromNode,
    );

    if (!updateNode.columns.length || !updateNode.values.length) {
      return {
        sql: formattedTable,
        bindings: [],
      };
    }

    const finalBindings: any[] = [];
    let paramCursor = updateNode.currParamIndex;
    const setClause = updateNode.columns
      .map((column, index) => {
        const value = updateNode.values[index];
        const formattedColumn = interpreterUtils.formatStringColumn(
          "mssql",
          column,
        );

        if (value instanceof RawNode) {
          return `${formattedColumn} = ${value.rawValue}`;
        }

        if (value instanceof QueryNode) {
          const rendered = new AstParser(
            this.model,
            "mssql" as SqlDataSourceType,
          ).parse([value], paramCursor, true);
          finalBindings.push(...rendered.bindings);
          paramCursor += rendered.bindings.length;
          return `${formattedColumn} = ${rendered.sql}`;
        }

        const placeholder = `@${paramCursor++}`;
        finalBindings.push(value);
        return `${formattedColumn} = ${placeholder}`;
      })
      .join(", ");

    const sql = `${formattedTable} set ${setClause}`;

    return {
      sql,
      bindings: finalBindings,
    };
  }
}

export default new MssqlUpdateInterpreter();
