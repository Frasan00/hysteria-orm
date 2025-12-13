import { AstParser } from "../../../ast/parser";
import { ColumnTypeNode } from "../../../ast/query/node/column";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { getColumnValue } from "../../../resources/utils";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MssqlColumnTypeInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const colNode = node as ColumnTypeNode;
    if (colNode.isRawValue) {
      return { sql: colNode.column as string, bindings: [] };
    }

    const utils = new InterpreterUtils(this.model);
    const columnName = utils.formatStringColumn(
      "mssql",
      getColumnValue(colNode.column),
    );

    const dt = colNode.dataType.toLowerCase();

    if (dt === "char") {
      const len = colNode.length ?? 1;
      return { sql: `${columnName} char(${len})`, bindings: [] };
    }

    if (dt === "varchar") {
      const len = colNode.length ?? 255;
      return { sql: `${columnName} varchar(${len})`, bindings: [] };
    }

    if (
      dt === "text" ||
      dt === "longtext" ||
      dt === "mediumtext" ||
      dt === "tinytext"
    ) {
      return { sql: `${columnName} varchar(max)`, bindings: [] };
    }

    if (dt === "uuid") {
      return { sql: `${columnName} uniqueidentifier`, bindings: [] };
    }

    if (dt === "ulid") {
      return { sql: `${columnName} varchar(26)`, bindings: [] };
    }

    if (dt === "bigint") {
      if (colNode.autoIncrement) {
        return { sql: `${columnName} bigint identity(1,1)`, bindings: [] };
      }
      return { sql: `${columnName} bigint`, bindings: [] };
    }

    if (dt === "tinyint") {
      return { sql: `${columnName} tinyint`, bindings: [] };
    }

    if (dt === "smallint") {
      return { sql: `${columnName} smallint`, bindings: [] };
    }

    if (dt === "mediumint") {
      return { sql: `${columnName} int`, bindings: [] };
    }

    if (dt === "float" || dt === "real") {
      return { sql: `${columnName} real`, bindings: [] };
    }

    if (dt === "double") {
      return { sql: `${columnName} float`, bindings: [] };
    }

    if (dt === "decimal" || dt === "numeric") {
      const precision = colNode.precision ?? 10;
      const scale = colNode.scale ?? 0;
      return {
        sql: `${columnName} decimal(${precision}, ${scale})`,
        bindings: [],
      };
    }

    if (dt === "date") {
      return { sql: `${columnName} date`, bindings: [] };
    }

    if (dt === "year") {
      return { sql: `${columnName} smallint`, bindings: [] };
    }

    if (dt === "time") {
      const p =
        typeof colNode.precision === "number" ? `(${colNode.precision})` : "";
      return { sql: `${columnName} time${p}`, bindings: [] };
    }

    if (dt === "datetime" || dt === "timestamp") {
      const p =
        typeof colNode.precision === "number" ? `(${colNode.precision})` : "";
      return { sql: `${columnName} datetime2${p}`, bindings: [] };
    }

    if (dt === "boolean" || dt === "bool") {
      return { sql: `${columnName} bit`, bindings: [] };
    }

    if (
      dt === "bytea" ||
      dt === "binary" ||
      dt === "varbinary" ||
      dt === "blob" ||
      dt === "longblob" ||
      dt === "mediumblob" ||
      dt === "tinyblob"
    ) {
      return { sql: `${columnName} varbinary(max)`, bindings: [] };
    }

    if (dt === "json" || dt === "jsonb") {
      return { sql: `${columnName} nvarchar(max)`, bindings: [] };
    }

    if (dt === "enum") {
      if (colNode.enumValues && colNode.enumValues.length > 0) {
        const values = colNode.enumValues.map((v) => `'${v}'`).join(", ");
        return {
          sql: `${columnName} varchar(255) check (${columnName} in (${values}))`,
          bindings: [],
        };
      }
      return { sql: `${columnName} varchar(255)`, bindings: [] };
    }

    if (dt === "integer" || dt === "int") {
      if (colNode.autoIncrement) {
        return { sql: `${columnName} int identity(1,1)`, bindings: [] };
      }
      return { sql: `${columnName} int`, bindings: [] };
    }

    if (dt === "geometry") {
      return { sql: `${columnName} geometry`, bindings: [] };
    }

    if (dt === "point") {
      return { sql: `${columnName} geometry`, bindings: [] };
    }

    if (dt === "linestring") {
      return { sql: `${columnName} geometry`, bindings: [] };
    }

    if (dt === "polygon") {
      return { sql: `${columnName} geometry`, bindings: [] };
    }

    if (dt === "multipoint") {
      return { sql: `${columnName} geometry`, bindings: [] };
    }

    return {
      sql: `${columnName} ${dt}${colNode.length ? `(${colNode.length})` : ""}`,
      bindings: [],
    };
  }
}

export default new MssqlColumnTypeInterpreter();
