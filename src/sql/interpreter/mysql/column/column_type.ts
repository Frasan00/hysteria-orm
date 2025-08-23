import { AstParser } from "../../../ast/parser";
import { ColumnTypeNode } from "../../../ast/query/node/column";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MysqlColumnTypeInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const colNode = node as ColumnTypeNode;
    if (colNode.isRawValue) {
      return { sql: colNode.column as string, bindings: [] };
    }

    const utils = new InterpreterUtils(this.model);
    const columnName = utils.formatStringColumn("mysql", colNode.column);
    const dt = colNode.dataType.toLowerCase();

    if (dt === "char") {
      const len = colNode.length ?? 1;
      return { sql: `${columnName} char(${len})`, bindings: [] };
    } else if (dt === "varchar") {
      const len = colNode.length ?? 255;
      return { sql: `${columnName} varchar(${len})`, bindings: [] };
    } else if (dt === "uuid") {
      return { sql: `${columnName} varchar(36)`, bindings: [] };
    } else if (dt === "ulid") {
      return { sql: `${columnName} varchar(26)`, bindings: [] };
    } else if (
      dt === "longtext" ||
      dt === "mediumtext" ||
      dt === "tinytext" ||
      dt === "text"
    ) {
      return { sql: `${columnName} ${dt}`, bindings: [] };
    } else if (dt === "integer" || dt === "int") {
      let sqlType = `int`;
      if (colNode.autoIncrement) {
        sqlType += " auto_increment";
      }
      return { sql: `${columnName} ${sqlType}`, bindings: [] };
    } else if (dt === "tinyint") {
      return { sql: `${columnName} tinyint`, bindings: [] };
    } else if (dt === "smallint") {
      return { sql: `${columnName} smallint`, bindings: [] };
    } else if (dt === "mediumint") {
      return { sql: `${columnName} mediumint`, bindings: [] };
    } else if (dt === "bigint") {
      let sqlType = `bigint`;
      if (colNode.autoIncrement) {
        sqlType += " auto_increment";
      }
      return { sql: `${columnName} ${sqlType}`, bindings: [] };
    } else if (dt === "float") {
      return { sql: `${columnName} float`, bindings: [] };
    } else if (dt === "double") {
      return { sql: `${columnName} double`, bindings: [] };
    } else if (dt === "real") {
      return { sql: `${columnName} double`, bindings: [] };
    } else if (dt === "decimal") {
      const precision = colNode.precision ?? 10;
      const scale = colNode.scale ?? 0;
      return {
        sql: `${columnName} decimal(${precision}, ${scale})`,
        bindings: [],
      };
    } else if (dt === "numeric") {
      const precision = colNode.precision ?? 10;
      const scale = colNode.scale ?? 0;
      return {
        sql: `${columnName} numeric(${precision}, ${scale})`,
        bindings: [],
      };
    } else if (dt === "date") {
      return { sql: `${columnName} date`, bindings: [] };
    } else if (dt === "time") {
      const p =
        typeof colNode.precision === "number" ? `(${colNode.precision})` : "";
      return { sql: `${columnName} time${p}`.trimEnd(), bindings: [] };
    } else if (dt === "datetime") {
      const p =
        typeof colNode.precision === "number" ? `(${colNode.precision})` : "";
      return { sql: `${columnName} datetime${p}`.trimEnd(), bindings: [] };
    } else if (dt === "timestamp") {
      const p =
        typeof colNode.precision === "number" ? `(${colNode.precision})` : "";
      return { sql: `${columnName} timestamp${p}`.trimEnd(), bindings: [] };
    } else if (dt === "year") {
      return { sql: `${columnName} year`, bindings: [] };
    } else if (dt === "boolean") {
      return { sql: `${columnName} boolean`, bindings: [] };
    } else if (dt === "varbinary") {
      const len = colNode.length ?? 255;
      return { sql: `${columnName} varbinary(${len})`, bindings: [] };
    } else if (dt === "binary") {
      const len = colNode.length ?? 255;
      return { sql: `${columnName} binary(${len})`, bindings: [] };
    } else if (dt === "bytea" || dt === "blob") {
      return { sql: `${columnName} blob`, bindings: [] };
    } else if (dt === "json" || dt === "jsonb") {
      return { sql: `${columnName} json`, bindings: [] };
    } else if (dt === "enum") {
      if (colNode.enumValues && colNode.enumValues.length > 0) {
        const values = colNode.enumValues.map((v) => `'${v}'`).join(", ");
        return { sql: `${columnName} enum(${values})`, bindings: [] };
      }
      return { sql: `${columnName} text`, bindings: [] };
    }

    return {
      sql: `${columnName} ${dt} ${colNode.length ? `(${colNode.length})` : ""}`,
      bindings: [],
    };
  }
}

export default new MysqlColumnTypeInterpreter();
