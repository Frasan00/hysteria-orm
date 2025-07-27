import { AstParser } from "../../../ast/parser";
import { ColumnTypeNode } from "../../../ast/query/node/column";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class PostgresColumnTypeInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const colNode = node as ColumnTypeNode;
    if (colNode.isRawValue) {
      return { sql: colNode.column as string, bindings: [] };
    }

    const utils = new InterpreterUtils(this.model);
    const columnName = utils.formatStringColumn("postgres", colNode.column);

    const dt = colNode.dataType.toLowerCase();

    if (dt === "char") {
      const len = colNode.length ?? 1;
      return { sql: `${columnName} char(${len})`, bindings: [] };
    } else if (dt === "varchar") {
      const len = colNode.length ?? 255;
      return { sql: `${columnName} varchar(${len})`, bindings: [] };
    } else if (
      dt === "text" ||
      dt === "longtext" ||
      dt === "mediumtext" ||
      dt === "tinytext"
    ) {
      return { sql: `${columnName} text`, bindings: [] };
    } else if (dt === "uuid") {
      return { sql: `${columnName} uuid`, bindings: [] };
    } else if (dt === "bigint") {
      if (colNode.autoIncrement) {
        return { sql: `${columnName} bigserial`, bindings: [] };
      }
      return { sql: `${columnName} bigint`, bindings: [] };
    } else if (dt === "float") {
      return { sql: `${columnName} real`, bindings: [] };
    } else if (dt === "double") {
      return { sql: `${columnName} double precision`, bindings: [] };
    } else if (dt === "decimal") {
      const precision = colNode.precision ?? 10;
      const scale = colNode.scale ?? 0;
      return {
        sql: `${columnName} numeric(${precision}, ${scale})`,
        bindings: [],
      };
    } else if (dt === "date") {
      return { sql: `${columnName} date`, bindings: [] };
    } else if (dt === "datetime" || dt === "timestamp") {
      const withTz = colNode.withTimezone
        ? " with time zone"
        : " without time zone";
      return {
        sql: `${columnName} timestamp${withTz}`.trimEnd(),
        bindings: [],
      };
    } else if (dt === "boolean") {
      return { sql: `${columnName} boolean`, bindings: [] };
    } else if (dt === "bytea" || dt === "binary") {
      return { sql: `${columnName} bytea`, bindings: [] };
    } else if (dt === "json") {
      return { sql: `${columnName} json`, bindings: [] };
    } else if (dt === "jsonb") {
      return { sql: `${columnName} jsonb`, bindings: [] };
    } else if (dt === "enum") {
      if (colNode.enumValues && colNode.enumValues.length > 0) {
        const values = colNode.enumValues.map((v) => `'${v}'`).join(", ");
        return {
          sql: `${columnName} text check (${columnName} in (${values}))`,
          bindings: [],
        };
      }
      return { sql: `${columnName} text`, bindings: [] };
    } else if (dt === "integer" || dt === "int") {
      if (colNode.autoIncrement) {
        return { sql: `${columnName} serial`, bindings: [] };
      }
      return { sql: `${columnName} integer`, bindings: [] };
    }

    return { sql: `${columnName} ${dt}`, bindings: [] };
  }
}

export default new PostgresColumnTypeInterpreter();
