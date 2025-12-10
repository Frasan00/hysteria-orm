import { DropNotNullNode } from "../../../ast/query/node/alter_table/drop_not_null";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";
import logger from "../../../../utils/logger";

class MssqlDropNotNullInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const n = node as DropNotNullNode;
    logger.warn(
      "MSSQL requires the full column type when altering nullability. " +
        "This operation may need manual adjustment.",
    );
    return { sql: `alter column [${n.column}] null`, bindings: [] };
  }
}
export default new MssqlDropNotNullInterpreter();
