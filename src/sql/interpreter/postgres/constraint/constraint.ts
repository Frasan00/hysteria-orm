import { AstParser } from "../../../ast/parser";
import { ConstraintNode } from "../../../ast/query/node/constraint";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { getColumnValue } from "../../../resources/utils";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class PostgresConstraintInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const cNode = node as ConstraintNode;

    const utils = new InterpreterUtils(this.model);

    if (cNode.constraintType === "primary_key") {
      if (cNode.columns && cNode.columns.length) {
        const sqlPrefix = cNode.constraintName
          ? `constraint "${cNode.constraintName}" `
          : "";
        const cols = (cNode.columns ?? [])
          .map((c) => utils.formatStringColumn("postgres", getColumnValue(c)))
          .join(", ");
        return { sql: `${sqlPrefix}primary key (${cols})`, bindings: [] };
      }
      return { sql: `primary key`, bindings: [] };
    }

    if (cNode.constraintType === "unique") {
      if (cNode.columns && cNode.columns.length > 0) {
        const colsArr = cNode.columns ?? [];
        const sqlPrefixU = cNode.constraintName
          ? `constraint "${cNode.constraintName}" `
          : "";
        const cols = colsArr
          .map((c) => utils.formatStringColumn("postgres", getColumnValue(c)))
          .join(", ");
        // For inline constraints in CREATE TABLE, don't include column names
        if (!cNode.constraintName) {
          return { sql: `unique`, bindings: [] };
        }
        return { sql: `${sqlPrefixU}unique (${cols})`, bindings: [] };
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
      if (cNode.defaultValue !== undefined) {
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
      return { sql: `default null`, bindings: [] };
    }

    if (cNode.constraintType === "foreign_key") {
      if (!cNode.columns || !cNode.columns.length) {
        return { sql: "", bindings: [] };
      }
      const cols = cNode.columns
        .map((c) => utils.formatStringColumn("postgres", getColumnValue(c)))
        .join(", ");
      if (!cNode.references) {
        return { sql: "", bindings: [] };
      }
      const refTable = utils.formatStringTable(
        "postgres",
        cNode.references.table,
      );
      const refCols = cNode.references.columns
        .map((c) => utils.formatStringColumn("postgres", getColumnValue(c)))
        .join(", ");
      const sqlPrefix = cNode.constraintName
        ? `constraint "${cNode.constraintName}" `
        : "";
      let sql = `${sqlPrefix}foreign key (${cols}) references ${refTable}(${refCols})`;
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

export default new PostgresConstraintInterpreter();
