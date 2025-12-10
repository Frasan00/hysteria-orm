import logger from "../../../../utils/logger";
import { AstParser } from "../../../ast/parser";
import { OnDuplicateNode } from "../../../ast/query/node/on_duplicate";
import { QueryNode } from "../../../ast/query/query";
import { Model } from "../../../models/model";
import { Interpreter } from "../../interpreter";

class MssqlOnDuplicateInterpreter implements Interpreter {
  declare model: typeof Model;

  toSql(node: QueryNode): ReturnType<typeof AstParser.prototype.parse> {
    const onDuplicateNode = node as OnDuplicateNode;

    if (onDuplicateNode.isRawValue) {
      return {
        sql: onDuplicateNode.table,
        bindings: [],
      };
    }

    logger.warn(
      "MSSQL does not support ON CONFLICT or ON DUPLICATE KEY. " +
        "Use MERGE statement for upsert operations. " +
        "This clause will be ignored. Consider using raw queries for MSSQL upserts.",
    );

    return {
      sql: "",
      bindings: [],
    };
  }
}

export default new MssqlOnDuplicateInterpreter();
