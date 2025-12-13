import { CreateExtensionNode } from "../../../ast/query/node/extension/create_extension";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class OracleCreateExtensionInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const ext = node as CreateExtensionNode;
    return {
      sql: `-- Oracle does not support extensions (extension: ${ext.extensionName})`,
      bindings: [],
    };
  }
}
export default new OracleCreateExtensionInterpreter();
