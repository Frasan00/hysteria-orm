import { AstParser } from "../../../ast/parser";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class SqliteCheckConstraintInfoInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    return { sql: "SELECT 1 WHERE 0", bindings: [] };
  }
}

export default new SqliteCheckConstraintInfoInterpreter();
