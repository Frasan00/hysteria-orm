import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class SqliteDropPrimaryKeyInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(_node: QueryNode) {
    // Not supported directly in SQLite (would require table rebuild)
    return { sql: ``, bindings: [] };
  }
}
export default new SqliteDropPrimaryKeyInterpreter();
