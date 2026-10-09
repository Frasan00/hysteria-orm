import { AstParser } from "../../../ast/parser";
import { FromNode } from "../../../ast/query/node/from";
import { RawNode } from "../../../ast/query/node/raw/raw_node";
import { UpdateNode } from "../../../ast/query/node/update";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { SqlDataSourceType } from "../../../sql_data_source_types";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MysqlUpdateInterpreter implements Interpreter {
  declare model: typeof Model;
  declare dbType?: SqlDataSourceType;

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
      "mysql",
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

    // Joins sit between the table and SET, so their bindings are pushed first
    let joinSql = "";
    if (updateNode.joinNodes?.length) {
      const parsed = new AstParser(
        this.model,
        "mysql" as SqlDataSourceType,
      ).parse(updateNode.joinNodes, paramCursor);
      joinSql = `${parsed.sql} `;
      finalBindings.push(...parsed.bindings);
      paramCursor += parsed.bindings.length;
    }

    const setClause = updateNode.columns
      .map((column, index) => {
        const value = updateNode.values[index];
        const formattedColumn = interpreterUtils.formatStringColumn(
          "mysql",
          column,
        );

        if (value instanceof RawNode) {
          return `${formattedColumn} = ${value.rawValue}`;
        }

        if (value instanceof QueryNode) {
          const rendered = new AstParser(
            this.model,
            "mysql" as SqlDataSourceType,
          ).parse([value], paramCursor, true);
          finalBindings.push(...rendered.bindings);
          paramCursor += rendered.bindings.length;
          return `${formattedColumn} = ${rendered.sql}`;
        }

        finalBindings.push(value);
        return `${formattedColumn} = ?`;
      })
      .join(", ");

    const sql = `${formattedTable} ${joinSql}set ${setClause}`;

    return {
      sql,
      bindings: finalBindings,
    };
  }
}

export default new MysqlUpdateInterpreter();
