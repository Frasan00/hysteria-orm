import { SetDefaultNode } from "../../../ast/query/node/alter_table/set_default";
import { RawNode } from "../../../ast/query/node/raw/raw_node";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class MssqlSetDefaultInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const n = node as SetDefaultNode;
    let val: string;

    if (n.defaultValue instanceof RawNode) {
      val = n.defaultValue.rawValue;
    } else if (n.defaultValue === "NULL" || n.defaultValue === null) {
      val = "null";
    } else if (n.defaultValue === "TRUE") {
      val = "1";
    } else if (n.defaultValue === "FALSE") {
      val = "0";
    } else if (
      typeof n.defaultValue === "string" &&
      n.defaultValue !== "null" &&
      n.defaultValue !== "1" &&
      n.defaultValue !== "0"
    ) {
      val = `'${n.defaultValue}'`;
    } else {
      val = String(n.defaultValue);
    }

    return {
      sql: `add constraint DF_${n.column} default ${val} for [${n.column}]`,
      bindings: [],
    };
  }
}
export default new MssqlSetDefaultInterpreter();
