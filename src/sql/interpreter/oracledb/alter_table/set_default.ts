import { SetDefaultNode } from "../../../ast/query/node/alter_table/set_default";
import { RawNode } from "../../../ast/query/node/raw/raw_node";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

/**
 * Oracle uses MODIFY column DEFAULT value syntax
 */
class OracleSetDefaultInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const n = node as SetDefaultNode;
    let val: string;

    if (n.defaultValue instanceof RawNode) {
      val = n.defaultValue.rawValue;
    } else if (n.defaultValue === "NULL") {
      val = "null";
    } else if (n.defaultValue === "TRUE") {
      val = "1";
    } else if (n.defaultValue === "FALSE") {
      val = "0";
    } else if (
      typeof n.defaultValue === "string" &&
      n.defaultValue !== "null"
    ) {
      val = `'${n.defaultValue}'`;
    } else {
      val = String(n.defaultValue);
    }

    return {
      sql: `modify "${n.column}" default ${val}`,
      bindings: [],
    };
  }
}

export default new OracleSetDefaultInterpreter();
