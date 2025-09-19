import { AstParser } from "../../../ast/parser";
import { ColumnTypeNode } from "../../../ast/query/node/column";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { getColumnValue } from "../../../resources/utils";
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
    const columnName = utils.formatStringColumn(
      "sqlite",
      getColumnValue(colNode.column),
    );
    const dt = colNode.dataType.toLowerCase();

    if (dt === "char" || dt === "varchar") {
      return { sql: `${columnName} text`, bindings: [] };
    } else if (dt === "uuid") {
      return { sql: `${columnName} varchar(36)`, bindings: [] };
    } else if (dt === "ulid") {
      return { sql: `${columnName} varchar(26)`, bindings: [] };
    }

    if (dt.includes("text")) {
      return { sql: `${columnName} text`, bindings: [] };
    } else if (dt === "integer" || dt === "bigint" || dt === "int") {
      return { sql: `${columnName} integer`, bindings: [] };
    } else if (dt === "tinyint") {
      return { sql: `${columnName} integer`, bindings: [] };
    } else if (dt === "smallint") {
      return { sql: `${columnName} integer`, bindings: [] };
    } else if (dt === "mediumint") {
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

    if (
      dt === "date" ||
      dt === "datetime" ||
      dt === "timestamp" ||
      dt === "time" ||
      dt === "year"
    ) {
      return { sql: `${columnName} text`, bindings: [] };
    } else if (dt === "boolean") {
      return { sql: `${columnName} integer`, bindings: [] };
    } else if (dt === "json" || dt === "jsonb") {
      return { sql: `${columnName} text`, bindings: [] };
    } else if (dt === "enum") {
      return { sql: `${columnName} text`, bindings: [] };
    } else if (
      dt === "bytea" ||
      dt === "blob" ||
      dt === "binary" ||
      dt === "longblob" ||
      dt === "mediumblob" ||
      dt === "tinyblob"
    ) {
      return { sql: `${columnName} blob`, bindings: [] };
    } else if (dt === "integer" || dt === "int") {
      if (colNode.autoIncrement) {
        return { sql: `${columnName} serial`, bindings: [] };
      }

      return { sql: `${columnName} integer`, bindings: [] };
    }

    return {
      sql: `${columnName} ${dt} ${colNode.length ? `(${colNode.length})` : ""}`,
      bindings: [],
    };
  }
}

export default new SqliteColumnTypeInterpreter();
