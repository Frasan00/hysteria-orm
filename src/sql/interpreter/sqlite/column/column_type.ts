import { AstParser } from "../../../ast/parser";
import { ColumnTypeNode } from "../../../ast/query/node/column";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class SqliteColumnTypeInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const colNode = node as ColumnTypeNode;
    if (colNode.isRawValue) {
      return { sql: colNode.column as string, bindings: [] };
    }

    const utils = new InterpreterUtils(this.model);
    const columnName = utils.formatStringColumn("sqlite", colNode.column);
    const dt = colNode.dataType.toLowerCase();

    if (dt === "char" || dt === "varchar") {
      const len = colNode.length ?? 255;
      return { sql: `${columnName} text`, bindings: [] };
    } else if (dt === "uuid") {
      return { sql: `${columnName} varchar(36)`, bindings: [] };
    }

    if (dt.includes("text")) {
      return { sql: `${columnName} text`, bindings: [] };
    } else if (dt === "integer" || dt === "bigint" || dt === "int") {
      if (colNode.autoIncrement) {
        return {
          sql: `${columnName} integer primary key autoincrement`,
          bindings: [],
        };
      }
      return { sql: `${columnName} integer`, bindings: [] };
    }

    if (dt === "float" || dt === "double") {
      return { sql: `${columnName} real`, bindings: [] };
    } else if (dt === "decimal" || dt === "numeric") {
      const precision = colNode.precision ?? 10;
      const scale = colNode.scale ?? 0;
      return {
        sql: `${columnName} numeric(${precision}, ${scale})`,
        bindings: [],
      };
    }

    if (dt === "date" || dt === "datetime" || dt === "timestamp") {
      return { sql: `${columnName} text`, bindings: [] };
    } else if (dt === "boolean") {
      return { sql: `${columnName} integer`, bindings: [] };
    } else if (dt === "json" || dt === "jsonb") {
      return { sql: `${columnName} text`, bindings: [] };
    } else if (dt === "enum") {
      return { sql: `${columnName} text`, bindings: [] };
    }

    if (dt === "bytea" || dt === "blob" || dt === "binary") {
      return { sql: `${columnName} blob`, bindings: [] };
    }

    return { sql: `${columnName} ${dt}`, bindings: [] };
  }
}

export default new SqliteColumnTypeInterpreter();
