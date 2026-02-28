import { AstParser } from "../../../ast/parser";
import { CheckConstraintInfoNode } from "../../../ast/query/node/schema/check_constraint_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MysqlCheckConstraintInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as CheckConstraintInfoNode;
    const table = node.table;
    const sql = `SELECT
    cc.CONSTRAINT_NAME AS name,
    cc.CHECK_CLAUSE AS expression
  FROM information_schema.CHECK_CONSTRAINTS cc
  JOIN information_schema.TABLE_CONSTRAINTS tc
    ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
    AND cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
  WHERE tc.TABLE_SCHEMA = DATABASE()
    AND tc.TABLE_NAME = '${table}'
    AND tc.CONSTRAINT_TYPE = 'CHECK'`;
    return { sql, bindings: [] };
  }
}

export default new MysqlCheckConstraintInfoInterpreter();
