import { SetDefaultNode } from "../../../ast/query/node/alter_table/set_default";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class SqliteSetDefaultInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const n = node as SetDefaultNode;
    let val = n.defaultValue;

    if (val === "NULL") {
      val = "null";
    } else if (val === "TRUE" || val === "FALSE") {
      val = val.toLowerCase();
    } else if (
      typeof val === "string" &&
      val !== "null" &&
      val !== "true" &&
      val !== "false"
    ) {
      val = `'${val}'`;
    }

    return {
      sql: `alter column "${n.column}" set default ${val}`,
      bindings: [],
    };
  }
}
export default new SqliteSetDefaultInterpreter();
