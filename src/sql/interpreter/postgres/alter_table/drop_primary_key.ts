import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class PgDropPrimaryKeyInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    return { sql: `drop constraint primary key`, bindings: [] };
  }
}
export default new PgDropPrimaryKeyInterpreter();
