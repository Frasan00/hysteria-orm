import { AstParser } from "../../../ast/parser";
import { ColumnTypeNode } from "../../../ast/query/node/column";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { getColumnValue } from "../../../resources/utils";
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
    const columnName = utils.formatStringColumn(
      "postgres",
      getColumnValue(colNode.column),
    );

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
    } else if (dt === "ulid") {
      return { sql: `${columnName} varchar(26)`, bindings: [] };
    } else if (dt === "bigint") {
      if (colNode.autoIncrement) {
        return { sql: `${columnName} bigserial`, bindings: [] };
      }
      return { sql: `${columnName} bigint`, bindings: [] };
    } else if (dt === "tinyint") {
      return { sql: `${columnName} smallint`, bindings: [] };
    } else if (dt === "smallint") {
      return { sql: `${columnName} smallint`, bindings: [] };
    } else if (dt === "mediumint") {
      return { sql: `${columnName} integer`, bindings: [] };
    } else if (dt === "float" || dt === "real") {
      return { sql: `${columnName} real`, bindings: [] };
    } else if (dt === "double") {
      return { sql: `${columnName} double precision`, bindings: [] };
    } else if (dt === "decimal" || dt === "numeric") {
      const precision = colNode.precision ?? 10;
      const scale = colNode.scale ?? 0;
      return {
        sql: `${columnName} numeric(${precision}, ${scale})`,
        bindings: [],
      };
    } else if (dt === "date") {
      return { sql: `${columnName} date`, bindings: [] };
    } else if (dt === "year") {
      return { sql: `${columnName} smallint`, bindings: [] };
    } else if (dt === "time") {
      const p =
        typeof colNode.precision === "number" ? `(${colNode.precision})` : "";
      return { sql: `${columnName} time${p}`, bindings: [] };
    } else if (dt === "datetime" || dt === "timestamp") {
      const withTz = colNode.withTimezone
        ? " with time zone"
        : " without time zone";
      const p =
        typeof colNode.precision === "number" ? `(${colNode.precision})` : "";
      let sql = `${columnName} timestamp${p}${withTz}`.trimEnd();
      if (colNode.autoCreate) {
        sql += ` default current_timestamp`;
      }
      return {
        sql,
        bindings: [],
      };
    } else if (dt === "boolean" || dt === "bool") {
      return { sql: `${columnName} boolean`, bindings: [] };
    } else if (
      dt === "bytea" ||
      dt === "binary" ||
      dt === "varbinary" ||
      dt === "blob" ||
      dt === "longblob" ||
      dt === "mediumblob" ||
      dt === "tinyblob"
    ) {
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
    } else if (dt === "geometry") {
      return { sql: `${columnName} geometry`, bindings: [] };
    } else if (dt === "point") {
      return { sql: `${columnName} point`, bindings: [] };
    } else if (dt === "linestring") {
      return { sql: `${columnName} linestring`, bindings: [] };
    } else if (dt === "polygon") {
      return { sql: `${columnName} polygon`, bindings: [] };
    } else if (dt === "multipoint") {
      return { sql: `${columnName} multipoint`, bindings: [] };
    }

    return {
      sql: `${columnName} ${dt} ${colNode.length ? `(${colNode.length})` : ""}`,
      bindings: [],
    };
  }
}

export default new PostgresColumnTypeInterpreter();
