import { DropColumnNode } from "../../../ast/query/node/alter_table/drop_column";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class SqliteDropColumnInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const d = node as DropColumnNode;
    return { sql: `drop column "${d.column}"`, bindings: [] };
  }
}

export default new SqliteDropColumnInterpreter();
