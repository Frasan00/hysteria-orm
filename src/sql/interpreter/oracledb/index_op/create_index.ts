import { CreateIndexNode } from "../../../ast/query/node/index_op/create_index";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";
import { InterpreterUtils } from "../../interpreter_utils";

/**
 * Oracle CREATE INDEX syntax:
 * CREATE [UNIQUE] INDEX index_name ON table_name (column1, column2, ...)
 */
class OracleCreateIndexInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const ci = node as CreateIndexNode;
    const utils = new InterpreterUtils(this.model);
    const tableSql = utils.formatStringTable("oracledb", ci.table);
    const cols = ci.columns.map((c) => `"${c}"`).join(", ");
    const unique = ci.unique ? "unique " : "";
    return {
      sql: `${unique}"${ci.indexName}" on ${tableSql} (${cols})`,
      bindings: [],
    };
  }
}

export default new OracleCreateIndexInterpreter();
