import { AstParser } from "../../../ast/parser";
import { InsertNode } from "../../../ast/query/node/insert";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MysqlInsertInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const insertNode = node as InsertNode;

    if (insertNode.isRawValue) {
      return {
        sql: insertNode.fromNode.table as string,
        bindings: [],
      };
    }

    const interpreterUtils = new InterpreterUtils(this.model);
    const formattedTable = interpreterUtils.getFromForWriteOperations(
      "mysql",
      insertNode.fromNode,
    );

    if (!insertNode.records.length) {
      return {
        sql: formattedTable,
        bindings: [],
      };
    }

    const firstRecord = insertNode.records[0];
    const columns = Object.keys(firstRecord);
    if (!columns.length) {
      return {
        sql: formattedTable,
        bindings: [],
      };
    }

    const formattedColumns = columns
      .map((column) => interpreterUtils.formatStringColumn("mysql", column))
      .join(", ");

    const allValues: any[] = [];
    const valuesClauses: string[] = [];

    for (const record of insertNode.records) {
      const recordValues = columns.map((column) => record[column]);
      allValues.push(...recordValues);

      const placeholders = Array(columns.length).fill("?").join(", ");
      valuesClauses.push(`(${placeholders})`);
    }

    const sql = `${formattedTable} (${formattedColumns}) VALUES ${valuesClauses.join(", ")}`;
    return {
      sql,
      bindings: allValues,
    };
  }
}

export default new MysqlInsertInterpreter();
