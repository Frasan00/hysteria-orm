import { AstParser } from "../../../ast/parser";
import { CheckConstraintInfoNode } from "../../../ast/query/node/schema/check_constraint_info";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class PostgresCheckConstraintInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const node = _node as CheckConstraintInfoNode;
    const table = node.table;
    const sql = `SELECT
    con.conname AS name,
    pg_get_constraintdef(con.oid) AS expression
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE con.contype = 'c'
    AND rel.relname = '${table}'
    AND nsp.nspname = current_schema()`;
    return { sql, bindings: [] };
  }
}

export default new PostgresCheckConstraintInfoInterpreter();
