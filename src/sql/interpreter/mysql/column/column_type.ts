import { AstParser } from "../../../ast/parser";
import { ColumnTypeNode } from "../../../ast/query/node/column";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { getColumnValue } from "../../../resources/utils";
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
    const columnName = utils.formatStringColumn(
      "mysql",
      getColumnValue(colNode.column),
    );
    const dt = colNode.dataType.toLowerCase();

    let typeSql: string;

    if (dt === "char") {
      const len = colNode.length ?? 1;
      typeSql = `${columnName} char(${len})`;
    } else if (dt === "varchar") {
      const len = colNode.length ?? 255;
      typeSql = `${columnName} varchar(${len})`;
    } else if (dt === "uuid") {
      typeSql = `${columnName} varchar(36)`;
    } else if (dt === "ulid") {
      typeSql = `${columnName} varchar(26)`;
    } else if (
      dt === "longtext" ||
      dt === "mediumtext" ||
      dt === "tinytext" ||
      dt === "text"
    ) {
      typeSql = `${columnName} ${dt}`;
    } else if (dt === "integer" || dt === "int") {
      typeSql = "int";
      if (colNode.autoIncrement) {
        typeSql += " auto_increment";
      }
      typeSql = `${columnName} ${typeSql}`;
    } else if (dt === "tinyint") {
      typeSql = `${columnName} tinyint`;
    } else if (dt === "smallint") {
      typeSql = `${columnName} smallint`;
    } else if (dt === "mediumint") {
      typeSql = `${columnName} mediumint`;
    } else if (dt === "bigint") {
      typeSql = "bigint";
      if (colNode.autoIncrement) {
        typeSql += " auto_increment";
      }
      typeSql = `${columnName} ${typeSql}`;
    } else if (dt === "float") {
      typeSql = `${columnName} float`;
    } else if (dt === "double") {
      typeSql = `${columnName} double`;
    } else if (dt === "real") {
      typeSql = `${columnName} double`;
    } else if (dt === "decimal") {
      const precision = colNode.precision ?? 10;
      const scale = colNode.scale ?? 0;
      typeSql = `${columnName} decimal(${precision}, ${scale})`;
    } else if (dt === "numeric") {
      const precision = colNode.precision ?? 10;
      const scale = colNode.scale ?? 0;
      typeSql = `${columnName} numeric(${precision}, ${scale})`;
    } else if (dt === "date") {
      typeSql = `${columnName} date`;
    } else if (dt === "time") {
      const p =
        typeof colNode.precision === "number" ? `(${colNode.precision})` : "";
      typeSql = `${columnName} time${p}`.trimEnd();
    } else if (dt === "datetime") {
      const p =
        typeof colNode.precision === "number" ? `(${colNode.precision})` : "";
      typeSql = `${columnName} datetime${p}`.trimEnd();
      if (colNode.autoCreate) {
        typeSql += ` default current_timestamp${p}`;
      }
      if (colNode.autoUpdate) {
        typeSql += ` on update current_timestamp${p}`;
      }
    } else if (dt === "timestamp") {
      const p =
        typeof colNode.precision === "number" ? `(${colNode.precision})` : "";
      typeSql = `${columnName} timestamp${p}`.trimEnd();
      if (colNode.autoCreate) {
        typeSql += ` default current_timestamp${p}`;
      }
      if (colNode.autoUpdate) {
        typeSql += ` on update current_timestamp${p}`;
      }
    } else if (dt === "year") {
      typeSql = `${columnName} year`;
    } else if (dt === "boolean") {
      typeSql = `${columnName} boolean`;
    } else if (dt === "varbinary") {
      const len = colNode.length ?? 255;
      typeSql = `${columnName} varbinary(${len})`;
    } else if (dt === "binary") {
      const len = colNode.length ?? 255;
      typeSql = `${columnName} binary(${len})`;
    } else if (dt === "bytea" || dt === "blob") {
      typeSql = `${columnName} blob`;
    } else if (dt === "json" || dt === "jsonb") {
      typeSql = `${columnName} json`;
    } else if (dt === "enum") {
      if (colNode.enumValues && colNode.enumValues.length > 0) {
        const values = colNode.enumValues.map((v) => `'${v}'`).join(", ");
        typeSql = `${columnName} enum(${values})`;
      } else {
        typeSql = `${columnName} text`;
      }
    } else if (dt === "geometry") {
      typeSql = `${columnName} geometry`;
    } else if (dt === "point") {
      typeSql = `${columnName} point`;
    } else if (dt === "linestring") {
      typeSql = `${columnName} linestring`;
    } else if (dt === "polygon") {
      typeSql = `${columnName} polygon`;
    } else if (dt === "multipoint") {
      typeSql = `${columnName} multipoint`;
    } else {
      typeSql =
        `${columnName} ${dt} ${colNode.length ? `(${colNode.length})` : ""}`.trim();
    }

    if (colNode.collate) {
      typeSql += ` COLLATE ${colNode.collate}`;
    }

    return { sql: typeSql, bindings: [] };
  }
}

export default new MysqlColumnTypeInterpreter();
