import { AstParser } from "../../../ast/parser";
import { HasCheckConstraintNode } from "../../../ast/query/node/schema/has_check_constraint";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class SqliteHasCheckConstraintInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as HasCheckConstraintNode;
    const sql = `SELECT sql FROM sqlite_master WHERE type='table' AND name='${node.table}'`;
    return { sql, bindings: [] };
  }
}

export default new SqliteHasCheckConstraintInterpreter();
