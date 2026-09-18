import { AstParser } from "../../../ast/parser";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";

/**
 * Neither MySQL nor MariaDB has `UPDATE ... RETURNING` (MariaDB only gained it for
 * INSERT/DELETE), so the clause is never emitted. Returning empty SQL makes the
 * parser skip the node, which keeps callers on the affected-rows path.
 */
class MysqlReturningInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(_node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    return {
      sql: "",
      bindings: [],
    };
  }
}

export default new MysqlReturningInterpreter();
