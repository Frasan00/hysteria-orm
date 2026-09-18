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
    const setClause = updateNode.columns
      .map((column, index) => {
        const value = updateNode.values[index];
        if (value instanceof RawNode) {
          return `${interpreterUtils.formatStringColumn("mysql", column)} = ${value.rawValue}`;
        }

        if (value instanceof SqlFuncNode) {
          const rendered = new AstParser(
            this.model,
            "mysql" as SqlDataSourceType,
          ).parse([value], 1, true).sql;
          return `${interpreterUtils.formatStringColumn("mysql", column)} = ${rendered}`;
        }

        finalBindings.push(value);
        return `${interpreterUtils.formatStringColumn("mysql", column)} = ?`;
      })
      .join(", ");

    const sql = `${formattedTable} set ${setClause}`;

    return {
      sql,
      bindings: finalBindings,
    };
  }
}

export default new MysqlUpdateInterpreter();
