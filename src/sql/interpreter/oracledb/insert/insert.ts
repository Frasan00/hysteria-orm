import { AstParser } from "../../../ast/parser";
import { InsertNode } from "../../../ast/query/node/insert";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class OracleInsertInterpreter implements Interpreter {
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
      "oracledb",
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
      .map((column) => interpreterUtils.formatStringColumn("oracledb", column))
      .join(", ");

    const allValues: any[] = [];
    const valuesClauses: string[] = [];
    let paramIndex = insertNode.currParamIndex;

    for (const record of insertNode.records) {
      const recordValues = columns.map((column) => record[column]);
      allValues.push(...recordValues);

      const placeholders = columns.map(() => `:${paramIndex++}`).join(", ");
      valuesClauses.push(`(${placeholders})`);
    }

    // Oracle uses INSERT ALL for multiple rows or single INSERT INTO ... VALUES
    // NOTE: INSERT ALL doesn't work correctly with identity columns (auto-increment)
    // This is handled at the model_manager level by inserting one at a time
    let sql: string;
    if (insertNode.records.length === 1) {
      sql = `${formattedTable} (${formattedColumns}) values ${valuesClauses[0]}`;
    } else {
      // For multiple records, use INSERT ALL ... SELECT * FROM DUAL
      insertNode.keyword = "insert";
      paramIndex = insertNode.currParamIndex;
      const insertAllClauses = insertNode.records.map(() => {
        const placeholders = columns.map(() => `:${paramIndex++}`).join(", ");
        return `into ${formattedTable} (${formattedColumns}) values (${placeholders})`;
      });
      sql = `all ${insertAllClauses.join(" ")} select * from dual`;
    }

    return {
      sql,
      bindings: allValues,
    };
  }
}

export default new OracleInsertInterpreter();
