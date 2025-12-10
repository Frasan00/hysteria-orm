import { SetDefaultNode } from "../../../ast/query/node/alter_table/set_default";
import { RawNode } from "../../../ast/query/node/raw/raw_node";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class PostgresSetDefaultInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const n = node as SetDefaultNode;
    let val: string;

    if (n.defaultValue instanceof RawNode) {
      val = n.defaultValue.rawValue;
    } else if (n.defaultValue === "NULL") {
      val = "null";
    } else if (n.defaultValue === "TRUE" || n.defaultValue === "FALSE") {
      val = n.defaultValue.toLowerCase();
    } else if (
      typeof n.defaultValue === "string" &&
      n.defaultValue !== "null" &&
      n.defaultValue !== "true" &&
      n.defaultValue !== "false"
    ) {
      val = `'${n.defaultValue}'`;
    } else {
      val = String(n.defaultValue);
    }

    return {
      sql: `alter column "${n.column}" set default ${val}`,
      bindings: [],
    };
  }
}
export default new PostgresSetDefaultInterpreter();
