import { SetNotNullNode } from "../../../ast/query/node/alter_table/set_not_null";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import type { Interpreter } from "../../interpreter";
import logger from "../../../../utils/logger";

class MssqlSetNotNullInterpreter implements Interpreter {
  declare model: typeof Model;
  toSql(node: QueryNode) {
    const n = node as SetNotNullNode;
    logger.warn(
      "MSSQL requires the full column type when altering nullability. " +
        "This operation may need manual adjustment.",
    );
    return { sql: `alter column [${n.column}] not null`, bindings: [] };
  }
}
export default new MssqlSetNotNullInterpreter();
