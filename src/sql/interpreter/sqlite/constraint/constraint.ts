import { AstParser } from "../../../ast/parser";
import { ConstraintNode } from "../../../ast/query/node/constraint";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { getColumnValue } from "../../../resources/utils";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class SqliteConstraintInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const cNode = node as ConstraintNode;
    const utils = new InterpreterUtils(this.model);
    const prefix = cNode.constraintName
      ? `constraint "${cNode.constraintName}" `
      : "";

    if (cNode.constraintType === "primary_key") {
      const autoIncrement = Boolean((cNode as any).autoIncrement);
      const columnType = ((cNode as any).columnType || "").toLowerCase();
      if (
        autoIncrement &&
        (columnType === "integer" || columnType === "bigint")
      ) {
        return { sql: `${prefix}primary key autoincrement`, bindings: [] };
      }
      return { sql: `${prefix}primary key`, bindings: [] };
    }

    if (cNode.constraintType === "unique") {
      if (cNode.columns && cNode.columns.length) {
        const cols = cNode.columns
          .map((c) => utils.formatStringColumn("sqlite", getColumnValue(c)))
          .join(", ");

        if (!cNode.constraintName) {
          return { sql: `unique`, bindings: [] };
        }
        return { sql: `${prefix}unique (${cols})`, bindings: [] };
      }
      return { sql: `unique`, bindings: [] };
    }

    if (cNode.constraintType === "not_null") {
      return { sql: `not null`, bindings: [] };
    }

    if (cNode.constraintType === "null") {
      return { sql: `null`, bindings: [] };
    }

    if (cNode.constraintType === "default") {
      let val = cNode.defaultValue;
      if (val === "NULL") {
        return { sql: `default null`, bindings: [] };
      }
      if (val === "TRUE" || val === "FALSE") {
        return { sql: `default ${val.toLowerCase()}`, bindings: [] };
      }
      if (val === null) {
        return { sql: `default null`, bindings: [] };
      }
      if (typeof val === "string") {
        val = `'${val}'`;
      }
      return { sql: `default ${val}`, bindings: [] };
    }

    if (cNode.constraintType === "foreign_key") {
      if (!cNode.references) {
        return { sql: "", bindings: [] };
      }
      const cols = (cNode.columns ?? [])
        .map((c) => utils.formatStringColumn("sqlite", getColumnValue(c)))
        .join(", ");
      const refTable = utils.formatStringTable(
        "sqlite",
        cNode.references.table,
      );
      const refCols = cNode.references.columns
        .map((c) => utils.formatStringColumn("sqlite", getColumnValue(c)))
        .join(", ");
      let sql = `${prefix}foreign key (${cols}) references ${refTable}(${refCols})`;
      if (cNode.onDelete) {
        sql += ` on delete ${cNode.onDelete}`;
      }
      if (cNode.onUpdate) {
        sql += ` on update ${cNode.onUpdate}`;
      }
      return { sql, bindings: [] };
    }

    return { sql: "", bindings: [] };
  }
}

export default new SqliteConstraintInterpreter();
