import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class PgDropPrimaryKeyInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(_node: QueryNode) {
    // Not available in postgres
    return { sql: ``, bindings: [] };
  }
}
export default new PgDropPrimaryKeyInterpreter();
