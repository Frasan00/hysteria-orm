import { CreateExtensionNode } from "../../../ast/query/node/extension/create_extension";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";

class PostgresCreateExtensionInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const ext = node as CreateExtensionNode;
    const ifNotExists = ext.ifNotExists ? "if not exists " : "";
    return {
      sql: `${ifNotExists}"${ext.extensionName}"`,
      bindings: [],
    };
  }
}
export default new PostgresCreateExtensionInterpreter();
