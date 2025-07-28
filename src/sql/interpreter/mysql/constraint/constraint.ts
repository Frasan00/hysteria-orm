import { AstParser } from "../../../ast/parser";
import { ConstraintNode } from "../../../ast/query/node/constraint";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

class MysqlConstraintInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const cNode = node as ConstraintNode;
    const utils = new InterpreterUtils(this.model);

    if (cNode.constraintType === "primary_key") {
      const cols = (cNode.columns ?? [])
        .map((c) => utils.formatStringColumn("mysql", c))
        .join(", ");
      const prefix = cNode.constraintName
        ? `constraint \`${cNode.constraintName}\` `
        : "";
      return { sql: `${prefix}primary key (${cols})`, bindings: [] };
    }

    if (cNode.constraintType === "unique") {
      const cols = (cNode.columns ?? [])
        .map((c) => utils.formatStringColumn("mysql", c))
        .join(", ");
      const prefix = cNode.constraintName
        ? `constraint \`${cNode.constraintName}\` `
        : "";
      return { sql: `${prefix}unique (${cols})`, bindings: [] };
    }

    if (cNode.constraintType === "not_null") {
      return { sql: `not null`, bindings: [] };
    }

    if (cNode.constraintType === "default") {
      let val = cNode.defaultValue;
      if (val === "NULL") {
        return { sql: `default null`, bindings: [] };
      }
      if (val === "TRUE" || val === "FALSE") {
        return { sql: `default ${val.toLowerCase()}`, bindings: [] };
      }
      if (typeof val === "string") {
        val = `'${val}'`;
      }
      if (val === null) {
        return { sql: `default null`, bindings: [] };
      }
      return { sql: `default ${val}`, bindings: [] };
    }

    if (cNode.constraintType === "foreign_key") {
      if (!cNode.references) {
        return { sql: "", bindings: [] };
      }
      const cols = (cNode.columns ?? [])
        .map((c) => utils.formatStringColumn("mysql", c))
        .join(", ");
      const refTable = utils.formatStringTable("mysql", cNode.references.table);
      const refCols = cNode.references.columns
        .map((c) => utils.formatStringColumn("mysql", c))
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
