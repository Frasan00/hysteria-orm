import { AstParser } from "../../../ast/parser";
import { CheckConstraintInfoNode } from "../../../ast/query/node/schema/check_constraint_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MssqlCheckConstraintInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as CheckConstraintInfoNode;
    const table = node.table;
    const sql = `SELECT
    cc.name AS name,
    cc.definition AS expression
  FROM sys.check_constraints cc
  JOIN sys.tables t ON cc.parent_object_id = t.object_id
  WHERE t.name = '${table}'`;
    return { sql, bindings: [] };
  }
}

export default new MssqlCheckConstraintInfoInterpreter();
