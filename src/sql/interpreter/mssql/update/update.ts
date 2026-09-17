import { AstParser } from "../../../ast/parser";
import { FromNode } from "../../../ast/query/node/from";
import { RawNode } from "../../../ast/query/node/raw/raw_node";
import { SqlFuncNode } from "../../../ast/query/node/sqlfunc/sqlfunc";
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

    let rawNodeCount = 0;
    const finalBindings: any[] = [];
    const setClause = updateNode.columns
      .map((column, index) => {
        const idx = updateNode.currParamIndex + index - rawNodeCount;
        const value = updateNode.values[index];

        if (value instanceof RawNode) {
          rawNodeCount++;
          return `${interpreterUtils.formatStringColumn("mssql", column)} = ${value.rawValue}`;
        }

        if (value instanceof SqlFuncNode) {
          rawNodeCount++;
          const rendered = new AstParser(
            this.model,
            "mssql" as SqlDataSourceType,
          ).parse([value], 1, true).sql;
          return `${interpreterUtils.formatStringColumn("mssql", column)} = ${rendered}`;
        }

        finalBindings.push(value);
        return `${interpreterUtils.formatStringColumn("mssql", column)} = @${idx}`;
      })
      .join(", ");

    let sql = `${formattedTable} set ${setClause}`;

    if (updateNode.returning && updateNode.returning.length) {
      const returningCols = updateNode.returning
        .map(
          (column) =>
            `inserted.${interpreterUtils.formatStringColumn("mssql", column)}${interpreterUtils.resolveColumnAlias("mssql", column)}`,
        )
        .join(", ");
      sql += ` output ${returningCols}`;
    }

    return {
      sql,
      bindings: finalBindings,
    };
  }
}

export default new MssqlUpdateInterpreter();
