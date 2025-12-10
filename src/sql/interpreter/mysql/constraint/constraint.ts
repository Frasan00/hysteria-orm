import { AstParser } from "../../../ast/parser";
import { ConstraintNode } from "../../../ast/query/node/constraint";
import { RawNode } from "../../../ast/query/node/raw/raw_node";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { getColumnValue } from "../../../resources/utils";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MysqlConstraintInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const cNode = node as ConstraintNode;
    const utils = new InterpreterUtils(this.model);

    if (cNode.constraintType === "primary_key") {
      const cols = (cNode.columns ?? [])
        .map((c) => utils.formatStringColumn("mysql", getColumnValue(c)))
        .join(", ");
      const prefix = cNode.constraintName
        ? `constraint \`${cNode.constraintName}\` `
        : "";
      return { sql: `${prefix}primary key (${cols})`, bindings: [] };
    }

    if (cNode.constraintType === "unique") {
      if (cNode.columns && cNode.columns.length > 0) {
        const cols = cNode.columns
          .map((c) => utils.formatStringColumn("mysql", getColumnValue(c)))
          .join(", ");
        const prefix = cNode.constraintName
          ? `constraint \`${cNode.constraintName}\` `
          : "";
        // For inline constraints in CREATE TABLE, don't include column names
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
      const val = cNode.defaultValue;
      if (val instanceof RawNode) {
        return { sql: `default ${val.rawValue}`, bindings: [] };
      }
      if (val === "NULL" || val === null) {
        return { sql: `default null`, bindings: [] };
      }
      if (val === "TRUE" || val === "FALSE") {
        return { sql: `default ${val.toLowerCase()}`, bindings: [] };
      }
      if (typeof val === "string") {
        return { sql: `default '${val}'`, bindings: [] };
      }
      return { sql: `default ${val}`, bindings: [] };
    }

    if (cNode.constraintType === "foreign_key") {
      if (!cNode.references) {
        return { sql: "", bindings: [] };
      }
      const cols = (cNode.columns ?? [])
        .map((c) => utils.formatStringColumn("mysql", getColumnValue(c)))
        .join(", ");
      const refTable = utils.formatStringTable("mysql", cNode.references.table);
      const refCols = cNode.references.columns
        .map((c) => utils.formatStringColumn("mysql", getColumnValue(c)))
        .join(", ");
      const prefix = cNode.constraintName
        ? `constraint \`${cNode.constraintName}\` `
        : "";
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

export default new MysqlConstraintInterpreter();
